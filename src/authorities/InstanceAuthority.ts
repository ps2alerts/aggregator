import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {TYPES} from '../constants/types';
import {pcWorldArray, World} from '../constants/world';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Zone} from '../constants/zone';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import {remove} from 'lodash';
import {jsonLogOutput} from '../utils/json';
import InstanceActionFactory from '../factories/InstanceActionFactory';
import {calculateRemainingTime} from '../utils/InstanceRemainingTime';
import {AxiosInstance, AxiosResponse} from 'axios';
import {ps2AlertsApiEndpoints} from '../constants/ps2AlertsApiEndpoints';
import config from '../config';
import {censusEnvironments} from '../constants/censusEnvironments';

@injectable()
export default class InstanceAuthority {
    private static readonly logger = getLogger('InstanceAuthority');
    private readonly currentInstances: PS2AlertsInstanceInterface[] = [];
    private activeTimer?: NodeJS.Timeout;
    private initialized = false;

    constructor(
        private readonly instanceActionFactory: InstanceActionFactory,
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
    ) {}

    public getInstance(instanceId: string): PS2AlertsInstanceInterface {
        InstanceAuthority.logger.silly(`Attempting to find an instance with ID: "${instanceId}"...`);

        const instance = this.currentInstances.find((i) => {
            return i.instanceId === instanceId;
        });

        if (!instance) {
            throw new ApplicationException(`Unable to find InstanceID "${instanceId}"!`, 'InstanceAuthority');
        }

        InstanceAuthority.logger.silly(`Found instance with ID: "${instanceId}"!`);
        InstanceAuthority.logger.silly(`${jsonLogOutput(instance)}`);

        return instance;
    }

    public getInstances(world: World, zone: Zone): PS2AlertsInstanceInterface[] {
        return this.currentInstances.filter((instance) => {
            return instance.match(world, zone) && instance.state === Ps2alertsEventState.STARTED;
        });
    }

    public getAllInstances(): PS2AlertsInstanceInterface[] {
        return this.currentInstances.filter((instance) => {
            return instance.state === Ps2alertsEventState.STARTED;
        });
    }

    public async startInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        if (!this.initialized) {
            throw new ApplicationException(`Attempted to start instance before initialized! World ${instance.world}!`);
        }

        InstanceAuthority.logger.info(`================== STARTING INSTANCE ON WORLD ${instance.world}! ==================`);

        if (instance instanceof MetagameTerritoryInstance) {
            const data = Object.assign(instance, {
                features: {
                    captureHistory: true,
                },
            });

            InstanceAuthority.logger.info(`[${instance.instanceId}] Sending instances POST to API ${ps2AlertsApiEndpoints.instances}`);
            await this.ps2AlertsApiClient.post(ps2AlertsApiEndpoints.instances, data)
                .then((response) => {
                    if (!response.data) {
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        throw new ApplicationException(`Unable to create instance via API! Responded with: ${response.data}`);
                    }
                })
                .catch((err) => {
                    if (err instanceof Error) {
                        throw new ApplicationException(`Unable to create instance via API! E: ${err.message}`);
                    }
                });

            InstanceAuthority.logger.info(`================ INSERTED NEW INSTANCE ${instance.instanceId} ================`);

            // Execute start actions, if it fails trash the instance
            try {
                // Nullify the bracket and hydrate the map records
                await this.instanceActionFactory.buildStart(instance).execute();

                // Now update the initial result record as we have the initial map state
                await this.instanceActionFactory.buildTerritoryResult(instance).execute();
            } catch (err) {
                // End early if instance failed to insert, so we don't add an instance to the list of actives.
                if (err instanceof Error) {
                    InstanceAuthority.logger.error(`[${instance.instanceId}] Failed to properly run start actions! E: ${err.message}`);
                }

                await this.trashInstance(instance);
                return false;
            }

            // Mark in the database the alert has now properly started
            await this.ps2AlertsApiClient.patch(
                ps2AlertsApiEndpoints.instancesInstance.replace('{instanceId}', instance.instanceId),
                {state: Ps2alertsEventState.STARTED},
            ).catch((err: Error) => {
                throw new ApplicationException(`[${instance.instanceId}] Unable to mark instance as STARTED! Err: ${err.message}`);
            });

            // Mark as started in memory state
            instance.state = Ps2alertsEventState.STARTED;

            this.currentInstances.push(instance); // Add instance to the in-memory data, so it can be called upon rapidly without polling DB
            this.printActives(); // Show currently running alerts in console / log

            InstanceAuthority.logger.info(`================== INSTANCE "${instance.instanceId}" STARTED! ==================`);

            return true;
        }

        throw new ApplicationException(`[${instance.instanceId}] Start instance ended unexpectedly!`, 'InstanceAuthority');
    }

    public async endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceAuthority.logger.info(`================== ENDING INSTANCE "${instance.instanceId}" ==================`);

        // Remove the active instance now from memory so more messages don't get accepted
        this.removeActiveInstance(instance);

        // Find Instance and update
        try {
            // Formally end the instance
            await this.instanceActionFactory.buildEnd(instance).execute();

            InstanceAuthority.logger.info(`================ SUCCESSFULLY ENDED INSTANCE "${instance.instanceId}" ================`);
            this.printActives(true);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${instance.instanceId}] Unable to end instance correctly! E: ${err}`, 'InstanceAuthority');
        }
    }

    public async init(): Promise<boolean> {
        InstanceAuthority.logger.debug('Initializing ActiveInstances...');

        if (this.initialized) {
            throw new ApplicationException('InstanceAuthority was called to be initialized more than once!', 'InstanceAuthority');
        }

        const apiResponse: AxiosResponse = await this.ps2AlertsApiClient.get(ps2AlertsApiEndpoints.instanceActive);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const instances: MetagameTerritoryInstance[] = apiResponse.data;

        if (!instances.length) {
            InstanceAuthority.logger.warn('No active instances were detected! This could be entirely normal however.');
        } else {
            instances.forEach((i) => {
                const censusEnvironment = config.census.censusEnvironment;

                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                if (censusEnvironment === censusEnvironments.pc && !pcWorldArray.includes(i.world)) {
                    InstanceAuthority.logger.warn(`[${i.instanceId}] Ignoring instance on world "${i.world}" instance in PC environment`);
                    return false;
                } else if (censusEnvironment === censusEnvironments.ps4eu && i.world !== World.CERES) {
                    InstanceAuthority.logger.warn(`[${i.instanceId}] Ignoring instance on world "${i.world}" instance in PS4EU environment`);
                    return false;
                } else if (censusEnvironment === censusEnvironments.ps4us && i.world !== World.GENUDINE) {
                    InstanceAuthority.logger.warn(`[${i.instanceId}] Ignoring instance on world "${i.world}" instance in PS4US environment`);
                    return false;
                }

                // Convert the date
                const instance = new MetagameTerritoryInstance(
                    i.world,
                    new Date(i.timeStarted), // It's a string from the API, convert back into Date
                    null,
                    i.result,
                    i.zone,
                    i.censusInstanceId,
                    i.censusMetagameEventType,
                    i.duration,
                    i.state,
                    i.bracket ?? undefined,
                );
                this.currentInstances.push(instance);
            });
        }

        // Set timer for instances display
        this.activeTimer = setInterval(() => {
            this.printActives();
        }, 60000);

        this.printActives(true);
        InstanceAuthority.logger.debug('Initializing ActiveInstances FINISHED');
        this.initialized = true;
        return true;
    }

    public printActives(mustShow = false): void {
        if (this.currentInstances.length) {
            InstanceAuthority.logger.info('==== Current actives =====');
            this.currentInstances.forEach((instance: PS2AlertsInstanceInterface) => {
                let output = `I: ${instance.instanceId} | W: ${instance.world}`;

                if (instance instanceof MetagameTerritoryInstance) {
                    output = `${output} | Z: ${instance.zone}`;
                }

                // Display expected time left
                const displayDate = new Date(0);
                displayDate.setSeconds(calculateRemainingTime(instance) / 1000);
                output = `${output} | ${displayDate.toISOString().substr(11, 8)} remaining`;

                InstanceAuthority.logger.info(output);
            });

            InstanceAuthority.logger.info('==== Current actives end =====');
        } else if (mustShow) {
            InstanceAuthority.logger.info('==== Current actives is empty =====');
        }
    }

    private removeActiveInstance(instance: PS2AlertsInstanceInterface): void {
        remove(this.currentInstances, (i) => {
            return i.instanceId === instance.instanceId;
        });

        InstanceAuthority.logger.debug(`================== ${instance.instanceId} removed from actives ==================`);
    }

    private async trashInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        const apiResponse = await this.ps2AlertsApiClient.delete(ps2AlertsApiEndpoints.instances);

        if (!apiResponse) {
            throw new ApplicationException(`[${instance.instanceId}] UNABLE TO DELETE INSTANCE! API CALL FAILED!`, 'InstanceAuthority');
        }

        InstanceAuthority.logger.error(`================ [${instance.instanceId}] INSTANCE DELETED! ================`);

        this.removeActiveInstance(instance);

        this.printActives(true);
    }
}
