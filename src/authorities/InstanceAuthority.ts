import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {TYPES} from '../constants/types';
import {pcWorldArray, World} from '../ps2alerts-constants/world';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Zone} from '../ps2alerts-constants/zone';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {remove} from 'lodash';
import {jsonLogOutput} from '../utils/json';
import InstanceActionFactory from '../factories/InstanceActionFactory';
import {calculateRemainingTime} from '../utils/InstanceRemainingTime';
import {AxiosInstance, AxiosResponse} from 'axios';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import config from '../config';
import {censusEnvironments} from '../ps2alerts-constants/censusEnvironments';
import QueueAuthority from './QueueAuthority';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Ps2alertsEventType} from '../ps2alerts-constants/ps2alertsEventType';
import InstanceAbstract from '../instances/InstanceAbstract';
import {PS2AlertsInstanceFeaturesInterface} from '../ps2alerts-constants/interfaces/PS2AlertsInstanceFeaturesInterface';

interface MetagameTerritoryActiveTableInterface {
    instanceId: string;
    world: World;
    zone: Zone;
    timeRemaining: string;
    vs: number | string;
    nc: number | string;
    tr: number | string;
    cutoff: number | string;
}

interface OutfitwarsTerritoryActiveTableInterface {
    instanceId: string;
    world: World;
    zone: Zone;
    timeRemaining: string;
    blue: number | string;
    red: number | string;
    cutoff: number | string;
}

interface InstanceMetadataInterface {
    features: PS2AlertsInstanceFeaturesInterface;
    mapVersion: string;
}

@injectable()
export default class InstanceAuthority {
    private static readonly logger = getLogger('InstanceAuthority');
    private readonly currentInstances: PS2AlertsInstanceInterface[] = [];
    private activeTimer?: NodeJS.Timeout;
    private initialized = false;

    constructor(
        private readonly instanceActionFactory: InstanceActionFactory,
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly queueAuthority: QueueAuthority,
    ) {}

    public getInstance(instanceId: string): PS2AlertsInstanceInterface | null {
        // TODO: Make this work for outfit wars instances
        InstanceAuthority.logger.silly(`Attempting to find an instance with ID: "${instanceId}"...`);

        const instance = this.currentInstances.find((i: PS2AlertsInstanceInterface) => {
            return i.instanceId === instanceId;
        });

        if (!instance) {
            InstanceAuthority.logger.error(`Unable to find InstanceID "${instanceId}"!`, 'InstanceAuthority');
            return null;
        }

        InstanceAuthority.logger.silly(`Found instance with ID: "${instanceId}"!`);
        InstanceAuthority.logger.silly(`${jsonLogOutput(instance)}`);

        return instance;
    }

    public getInstances(world: World | null = null, zone: Zone | null = null): PS2AlertsInstanceInterface[] {
        // TODO: Make this work for outfit wars instances
        if (world && zone) {
            return this.currentInstances.filter((instance) => {
                return instance.match(world, zone) && instance.state === Ps2alertsEventState.STARTED;
            });
        }

        if (world) {
            return this.currentInstances.filter((instance) => {
                return instance.match(world, null) && instance.state === Ps2alertsEventState.STARTED;
            });
        }

        return this.currentInstances.filter((instance) => {
            return instance.match(null, zone) && instance.state === Ps2alertsEventState.STARTED;
        });
    }

    public getAllInstances(): PS2AlertsInstanceInterface[] {
        // TODO: Make this work for outfit wars instances
        return this.currentInstances.filter((instance) => {
            return instance.state === Ps2alertsEventState.STARTED;
        });
    }

    public async startInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        if (!this.initialized) {
            throw new ApplicationException(`Attempted to start instance before initialized! World ${instance.world}!`);
        }

        // If SolTech, chuck. Websocket is massively broken for SolTech at the moment.
        if (instance.world === World.SOLTECH) {
            InstanceAuthority.logger.info('SolTech instance detected. Ignoring.');
            return false;
        }

        InstanceAuthority.logger.info(`=== STARTING INSTANCE ON WORLD ${instance.world}! ===`);

        const instanceMetadata: InstanceMetadataInterface = Object.assign(instance, {
            features: {
                captureHistory: true,
                xpm: true,
            },
            mapVersion: instance.zone === Zone.OSHUR ? '1.1' : '1.0', // As of 13th July Oshur uses a new map
        });

        try {
            if (instance instanceof MetagameTerritoryInstance) {
                await this.startTerritoryControlInstance(instance, instanceMetadata);
            }

            if (instance instanceof OutfitWarsTerritoryInstance) {
                await this.startOutfitwarsTerritoryInstance(instance, instanceMetadata);
            }

            // Mark as started in memory state
            instance.state = Ps2alertsEventState.STARTED;

            this.currentInstances.push(instance); // Add instance to the in-memory data, so it can be called upon rapidly without polling DB
            this.printActives(); // Show currently running alerts in console / log

            // Subscribe to world rabbit queues to listen to messages
            this.queueAuthority.syncActiveInstances(this.currentInstances);
            await this.queueAuthority.startQueuesForInstance(instance);

            InstanceAuthority.logger.info(`================== INSTANCE "${instance.instanceId}" STARTED! ==================`);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${instance.instanceId}] Unable to start instance correctly! E: ${err}`, 'InstanceAuthority.startInstance');
        }

        return true;
    }

    public async endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceAuthority.logger.info(`==== ENDING INSTANCE "${instance.instanceId}" ===`);

        // Remove the active instance now from memory so more messages don't get accepted
        this.removeActiveInstance(instance);

        // Find Instance and update
        try {
            // Formally end the instance
            await this.instanceActionFactory.buildEnd(instance).execute();
            this.queueAuthority.syncActiveInstances(this.currentInstances);
            this.queueAuthority.stopQueuesForInstance(instance);

            InstanceAuthority.logger.info(`=== SUCCESSFULLY ENDED INSTANCE "${instance.instanceId}" ===`);
            this.printActives(true);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${instance.instanceId}] Unable to end instance correctly! E: ${err}`, 'InstanceAuthority');
        }
    }

    public async trashInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        InstanceAuthority.logger.info(`=== TRASHING INSTANCE "${instance.instanceId}" ===`);

        this.removeActiveInstance(instance);

        await this.ps2AlertsApiClient.delete(ps2AlertsApiEndpoints.instancesInstance.replace('{instanceId}', instance.instanceId))
            .catch((err: Error) => {
                throw new ApplicationException(`[${instance.instanceId}] UNABLE TO TRASH INSTANCE! API CALL FAILED! E: ${err.message}`, 'InstanceAuthority');
            });

        InstanceAuthority.logger.error(`=== [${instance.instanceId}] INSTANCE TRASHED! ===`);

        this.printActives(true);
    }

    public async init(): Promise<boolean> {
        InstanceAuthority.logger.debug('Initializing ActiveInstances...');

        if (this.initialized) {
            throw new ApplicationException('InstanceAuthority was called to be initialized more than once!', 'InstanceAuthority');
        }

        let apiResponse: AxiosResponse;

        try {
            apiResponse = await this.ps2AlertsApiClient.get(ps2AlertsApiEndpoints.instanceActive);
        } catch (err) {
            throw new ApplicationException('Unable to get Active Instances from PS2Alerts API! Crashing the app...', 'InstanceAuthority', 1);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const instances: InstanceAbstract[] = apiResponse.data;

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

                let instance: PS2AlertsInstanceInterface;
                let instanceAlias;

                switch (i.ps2alertsEventType) {
                    case Ps2alertsEventType.LIVE_METAGAME:
                        instanceAlias = i as MetagameTerritoryInstance;
                        instance = new MetagameTerritoryInstance(
                            i.world,
                            instanceAlias.zone,
                            instanceAlias.censusInstanceId,
                            new Date(i.timeStarted), // It's a string from the API, convert back into Date
                            null,
                            instanceAlias.result,
                            instanceAlias.censusMetagameEventType,
                            i.duration,
                            i.state,
                            instanceAlias.bracket ?? undefined,
                        );
                        break;
                    case Ps2alertsEventType.OUTFIT_WARS_AUG_2022:
                        instanceAlias = i as OutfitWarsTerritoryInstance;
                        instance = new OutfitWarsTerritoryInstance(
                            i.world,
                            Zone.NEXUS,
                            instanceAlias.zoneInstanceId,
                            new Date(i.timeStarted),
                            null,
                            instanceAlias.result,
                            i.state,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            instanceAlias.phase,
                            instanceAlias.round,
                        );
                        break;
                    default:
                        throw new ApplicationException('Unknown ps2alertsEventType!', 'InstanceAuthority.init');
                }

                this.currentInstances.push(instance);
            });
        }

        // Set timer for instances display
        this.activeTimer = setInterval(() => {
            this.printActives();
        }, 60000);

        InstanceAuthority.logger.info('Subscribing to message queues...');
        this.queueAuthority.syncActiveInstances(this.currentInstances);
        await this.queueAuthority.subscribeToActives();

        this.printActives(true);
        InstanceAuthority.logger.debug('Initializing ActiveInstances FINISHED');
        this.initialized = true;
        return true;
    }

    public printActives(mustShow = false): void {
        if (this.currentInstances.length) {
            InstanceAuthority.logger.info('=== Current actives ===');
            const metagameTerritoryRows: MetagameTerritoryActiveTableInterface[] = [];
            const outfitwarsTerritoryRows: OutfitwarsTerritoryActiveTableInterface[] = [];

            this.currentInstances.forEach((instance: PS2AlertsInstanceInterface) => {
                // Display expected time left
                const displayDate = new Date(0);
                displayDate.setSeconds(calculateRemainingTime(instance) / 1000);

                if (instance instanceof MetagameTerritoryInstance) {
                    const object: MetagameTerritoryActiveTableInterface = {
                        instanceId: instance.instanceId,
                        world: instance.world,
                        zone: instance.zone,
                        timeRemaining: `${displayDate.toISOString().substr(11, 8)}`,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        vs: instance.result?.vs ?? '???',
                        nc: instance.result?.nc ?? '???',
                        tr: instance.result?.tr ?? '???',
                        cutoff: instance.result?.cutoff ?? '???',
                    };
                    metagameTerritoryRows.push(object);
                }

                if (instance instanceof OutfitWarsTerritoryInstance) {
                    const object: OutfitwarsTerritoryActiveTableInterface = {
                        instanceId: instance.instanceId,
                        world: instance.world,
                        zone: instance.zone,
                        timeRemaining: `${displayDate.toISOString().substr(11, 8)}`,
                        blue: instance.result?.blue ?? '???',
                        red: instance.result?.red ?? '???',
                        cutoff: instance.result?.cutoff ?? '???',
                    };
                    outfitwarsTerritoryRows.push(object);
                }
            });

            if (metagameTerritoryRows.length) {
                console.table(metagameTerritoryRows);
            }

            if (outfitwarsTerritoryRows.length) {
                console.table(outfitwarsTerritoryRows);
            }
        } else if (mustShow) {
            InstanceAuthority.logger.info('=== Current actives is empty ===');
        }
    }

    private removeActiveInstance(instance: PS2AlertsInstanceInterface): void {
        remove(this.currentInstances, (i) => {
            return i.instanceId === instance.instanceId;
        });

        InstanceAuthority.logger.debug(`=== ${instance.instanceId} removed from actives ===`);
    }

    private async startTerritoryControlInstance(instance: MetagameTerritoryInstance, metadata: InstanceMetadataInterface): Promise<boolean> {
        InstanceAuthority.logger.info(`[${instance.instanceId}] Sending instances POST to API ${ps2AlertsApiEndpoints.instances}`);
        await this.ps2AlertsApiClient.post(ps2AlertsApiEndpoints.instances, metadata)
            .then((response) => {
                if (!response.data) {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    throw new ApplicationException(`Unable to create instance via API! Responded with: ${response.data}`, 'InstanceAuthority.startTerritoryControlInstance');
                }
            })
            .catch((err) => {
                new ExceptionHandler('Unable to create instance via API!', err, 'InstanceAuthority.startTerritoryControlInstance');
            });

        InstanceAuthority.logger.info(`=== INSERTED NEW METAGAME TERRITORY INSTANCE ${instance.instanceId} ===`);

        // Execute start actions, if it fails trash the instance
        try {
            // Nullify the bracket and hydrate the map records
            await this.instanceActionFactory.buildStart(instance).execute();

            // Now update the initial result record as we have the initial map state
            await this.instanceActionFactory.buildMetagameTerritoryResult(instance).execute();
        } catch (err) {
            // End early if instance failed to insert, so we don't add an instance to the list of actives.
            if (err instanceof Error) {
                InstanceAuthority.logger.error(`[${instance.instanceId}] Failed to properly run start actions! E: ${err.message}`, 'InstanceAuthority.startTerritoryControlInstance');
            }

            await this.trashInstance(instance);
            return false;
        }

        // Mark in the database the alert has now properly started
        await this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.instancesInstance.replace('{instanceId}', instance.instanceId),
            {state: Ps2alertsEventState.STARTED},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${instance.instanceId}] Unable to mark instance as STARTED! Err: ${err.message}`, 'InstanceAuthority.startTerritoryControlInstance');
        });

        return true;
    }

    private async startOutfitwarsTerritoryInstance(instance: OutfitWarsTerritoryInstance, metadata: InstanceMetadataInterface): Promise<boolean> {
        InstanceAuthority.logger.info(`[${instance.instanceId}] Sending outfitwars instances POST to API ${ps2AlertsApiEndpoints.outfitwars}`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.ps2AlertsApiClient.post(ps2AlertsApiEndpoints.outfitwars, metadata)
            .then((response) => {
                if (!response.data) {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    throw new ApplicationException(`Unable to create instance via API! Responded with: ${response.data}`, 'InstanceAuthority.startOutfitwarsTerritoryInstance');
                }
            })
            .catch((err) => {
                new ExceptionHandler('Unable to create instance via API!', err, 'InstanceAuthority.startOutfitWarsTerritoryInstance');
            });

        InstanceAuthority.logger.info(`=== INSERTED NEW OUTFIT WARS TERRITORY INSTANCE ${instance.instanceId} ===`);

        // Execute start actions, if it fails trash the instance
        try {
            // Nullify the bracket and hydrate the map records
            await this.instanceActionFactory.buildStart(instance).execute();

            // Now update the initial result record as we have the initial map state
            await this.instanceActionFactory.buildOutfitwarsResult(instance).execute();
        } catch (err) {
            // End early if instance failed to insert, so we don't add an instance to the list of actives.
            if (err instanceof Error) {
                InstanceAuthority.logger.error(`[${instance.instanceId}] Failed to properly run start actions! E: ${err.message}`, 'InstanceAuthority.startOutfitWarsTerritoryInstance');
            }

            await this.trashInstance(instance);
            return false;
        }

        // Mark in the database the alert has now properly started
        await this.ps2AlertsApiClient.patch(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            ps2AlertsApiEndpoints.outfitwarsInstance.replace('{instanceId}', instance.instanceId),
            {state: Ps2alertsEventState.STARTED},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${instance.instanceId}] Unable to mark instance as STARTED! Err: ${err.message}`, 'InstanceAuthority.startOutfitWarsTerritoryInstance');
        });

        return true;
    }
}
