/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {Inject, Injectable, Logger} from '@nestjs/common';
import ApplicationException from '../exceptions/ApplicationException';
import {TYPES} from '../constants/types';
import {pcWorldArray, World} from '../ps2alerts-constants/world';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getZoneLatticeVersion, Zone} from '../ps2alerts-constants/zone';
import {Ps2AlertsEventState} from '../ps2alerts-constants/ps2AlertsEventState';
import {remove} from 'lodash';
import {jsonLogOutput} from '../utils/json';
import InstanceActionFactory from '../factories/InstanceActionFactory';
import {calculateRemainingTime} from '../utils/InstanceRemainingTime';
import {AxiosInstance, AxiosResponse} from 'axios';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {censusEnvironments} from '../ps2alerts-constants/censusEnvironments';
import QueueAuthority from './QueueAuthority';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Ps2AlertsEventType} from '../ps2alerts-constants/ps2AlertsEventType';
import InstanceAbstract from '../instances/InstanceAbstract';
import {PS2AlertsInstanceFeaturesInterface} from '../ps2alerts-constants/interfaces/PS2AlertsInstanceFeaturesInterface';
import Redis from 'ioredis';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';
import {ConfigService} from '@nestjs/config';
import {PS2Environment} from 'ps2census';

interface InstanceMetadataInterface {
    features: PS2AlertsInstanceFeaturesInterface;
    mapVersion: string;
    latticeVersion: string;
}

interface TerritoryActiveTableInterface {
    instanceId: string;
    world: World;
    zone: Zone;
    timeRemaining: string;
    cutoff: number | string;
    outOfPlay: number | string;
}

interface MetagameTerritoryActiveTableInterface extends TerritoryActiveTableInterface {
    vs: number | string;
    nc: number | string;
    tr: number | string;
}

interface OutfitwarsTerritoryActiveTableInterface extends TerritoryActiveTableInterface {
    blue: number | string;
    red: number | string;
}

@Injectable()
export default class InstanceAuthority {
    private static readonly logger = new Logger('InstanceAuthority');
    private readonly currentInstances: PS2AlertsInstanceInterface[] = [];
    private activeTimer?: NodeJS.Timeout;
    private initialized = false;
    private readonly censusEnvironment: PS2Environment;

    constructor(
        private readonly instanceActionFactory: InstanceActionFactory,
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly queueAuthority: QueueAuthority,
        private readonly cacheClient: Redis, // Required for Population aggregation
        private readonly statisticsHandler: StatisticsHandler,
        config: ConfigService,
    ) {
        this.censusEnvironment = config.getOrThrow('census.environment');
    }

    public getInstance(instanceId: string): PS2AlertsInstanceInterface | null {
        InstanceAuthority.logger.verbose(`Attempting to find an instance with ID: "${instanceId}"...`);

        const instance = this.currentInstances.find((i: PS2AlertsInstanceInterface) => {
            return i.instanceId === instanceId;
        });

        if (!instance) {
            InstanceAuthority.logger.error(`Unable to find InstanceID "${instanceId}"!`, 'InstanceAuthority');
            return null;
        }

        InstanceAuthority.logger.verbose(`Found instance with ID: "${instanceId}"!`);
        InstanceAuthority.logger.verbose(`${jsonLogOutput(instance)}`);

        return instance;
    }

    public getInstances(world: World | null = null, zone: Zone | number | null = null): PS2AlertsInstanceInterface[] {
        if (world && zone) {
            return this.currentInstances.filter((instance) => {
                return instance.match(world, zone) && instance.state === Ps2AlertsEventState.STARTED;
            });
        }

        if (world) {
            return this.currentInstances.filter((instance) => {
                return instance.match(world, null) && instance.state === Ps2AlertsEventState.STARTED;
            });
        }

        return this.currentInstances.filter((instance) => {
            return instance.match(null, zone) && instance.state === Ps2AlertsEventState.STARTED;
        });
    }

    public getAllInstances(): PS2AlertsInstanceInterface[] {
        return this.currentInstances.filter((instance) => {
            return instance.state === Ps2AlertsEventState.STARTED;
        });
    }

    public async startInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        if (!this.initialized) {
            throw new ApplicationException(`Attempted to start instance before initialized! World ${instance.world}!`);
        }

        InstanceAuthority.logger.log(`=== STARTING INSTANCE ON WORLD ${instance.world}! ===`);

        const instanceMetadata: InstanceMetadataInterface = Object.assign(instance, {
            features: {
                captureHistory: true,
                xpm: true,
            },
            mapVersion: instance.zone === Zone.OSHUR ? '1.1' : '1.0', // As of 13th July Oshur uses a new map
            latticeVersion: getZoneLatticeVersion(instance.zone, instance.timeStarted),
        });

        try {
            if (instance instanceof MetagameTerritoryInstance) {
                await this.startTerritoryControlInstance(instance, instanceMetadata);
            }

            if (instance instanceof OutfitWarsTerritoryInstance) {
                await this.startOutfitwarsTerritoryInstance(instance, instanceMetadata);
            }

            // Mark as started in memory state
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            instance.state = Ps2AlertsEventState.STARTED;

            this.currentInstances.push(instance); // Add instance to the in-memory data, so it can be called upon rapidly without polling DB
            this.printActives(); // Show currently running alerts in console / log

            // Subscribe to world rabbit queues to listen to messages
            this.queueAuthority.syncActiveInstances(this.currentInstances);
            await this.queueAuthority.startQueuesForInstance(instance);

            // Add to a redis key set so PopulationInstances is aware of active instances without causing a dependency injection loop
            await this.cacheClient.sadd(`ActiveInstances-${this.censusEnvironment}`, instance.instanceId);

            InstanceAuthority.logger.log(`================== INSTANCE "${instance.instanceId}" STARTED! ==================`);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${instance.instanceId}] Unable to start instance correctly! E: ${err}`, 'InstanceAuthority.startInstance');
        }

        return true;
    }

    public async endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceAuthority.logger.log(`==== ENDING INSTANCE "${instance.instanceId}" ===`);

        // Remove the active instance now from memory so more messages don't get accepted
        await this.removeActiveInstance(instance);

        // Find Instance and update
        try {
            // Formally end the instance
            await this.instanceActionFactory.buildEnd(instance).execute();
            this.queueAuthority.syncActiveInstances(this.currentInstances);
            this.queueAuthority.stopQueuesForInstance(instance);

            InstanceAuthority.logger.log(`=== SUCCESSFULLY ENDED INSTANCE "${instance.instanceId}" ===`);
            this.printActives(true);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`[${instance.instanceId}] Unable to end instance correctly! E: ${err}`, 'InstanceAuthority');
        }
    }

    public async trashInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        InstanceAuthority.logger.log(`=== TRASHING INSTANCE "${instance.instanceId}" ===`);

        await this.removeActiveInstance(instance);

        const started = new Date();

        await this.ps2AlertsApiClient.delete(ps2AlertsApiEndpoints.instancesInstance.replace('{instanceId}', instance.instanceId))
            .catch((err: Error) => {
                throw new ApplicationException(`[${instance.instanceId}] UNABLE TO TRASH INSTANCE! API CALL FAILED! E: ${err.message}`, 'InstanceAuthority');
            });

        await this.statisticsHandler.logTime(started, MetricTypes.PS2ALERTS_API);

        InstanceAuthority.logger.error(`=== [${instance.instanceId}] INSTANCE TRASHED! ===`);

        this.printActives(true);
    }

    public async init(): Promise<boolean> {
        InstanceAuthority.logger.debug('Initializing ActiveInstances...');

        if (this.initialized) {
            throw new ApplicationException('InstanceAuthority was called to be initialized more than once!', 'InstanceAuthority');
        }

        // Flush the ActiveInstances out of Redis
        await this.cacheClient.del(`ActiveInstances-${this.censusEnvironment}`);

        let apiResponses: AxiosResponse[];

        const started = new Date();

        const promises = [
            await this.ps2AlertsApiClient.get(ps2AlertsApiEndpoints.instanceActive),
            // await this.ps2AlertsApiClient.get(ps2AlertsApiEndpoints.outfitwarsActive),
        ];

        try {
            apiResponses = await Promise.all(promises);
        } catch (err) {
            throw new ApplicationException('Unable to get Active Instances from PS2Alerts API! Crashing the app...', 'InstanceAuthority', 1);
        }

        await this.statisticsHandler.logTime(started, MetricTypes.PS2ALERTS_API);

        const instances: InstanceAbstract[] = [];

        apiResponses.forEach((instanceList) => {
            const instancesArray = instanceList.data as InstanceAbstract[];
            instancesArray.forEach((instance) => {
                instances.push(instance);
            });
        });

        if (!instances.length) {
            InstanceAuthority.logger.warn('No active instances were detected! This could be entirely normal however.');
        } else {
            for (const i of instances) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                if (this.censusEnvironment === censusEnvironments.pc && !pcWorldArray.includes(i.world)) {
                    InstanceAuthority.logger.warn(`[${i.instanceId}] Ignoring instance on world "${i.world}" instance in PC environment`);
                    continue;
                } else if (this.censusEnvironment === censusEnvironments.ps4eu && i.world !== World.CERES) {
                    InstanceAuthority.logger.warn(`[${i.instanceId}] Ignoring instance on world "${i.world}" instance in PS4EU environment`);
                    continue;
                } else if (this.censusEnvironment === censusEnvironments.ps4us && i.world !== World.GENUDINE) {
                    InstanceAuthority.logger.warn(`[${i.instanceId}] Ignoring instance on world "${i.world}" instance in PS4US environment`);
                    continue;
                }

                let instance: PS2AlertsInstanceInterface;
                let instanceAlias;

                switch (i.ps2AlertsEventType) {
                    case Ps2AlertsEventType.LIVE_METAGAME:
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
                    case Ps2AlertsEventType.OUTFIT_WARS_AUG_2022:
                        instanceAlias = i as OutfitWarsTerritoryInstance;
                        instance = new OutfitWarsTerritoryInstance(
                            i.world,
                            Zone.NEXUS,
                            instanceAlias.zoneInstanceId,
                            instanceAlias.censusInstanceId,
                            new Date(i.timeStarted),
                            null,
                            instanceAlias.result,
                            i.state,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                            instanceAlias.outfitwars,
                        );
                        break;
                    default:
                        InstanceAuthority.logger.error('Unknown ps2AlertsEventType! Assuming it is LIVE_METAGAME');
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
                }

                this.currentInstances.push(instance);

                // Push the current instances to the Redis instance list to give PopulationAuthority awareness of running instances
                InstanceAuthority.logger.log(`Pushing instance ${instance.instanceId} to ActiveInstances-${this.censusEnvironment}`);
                await this.cacheClient.sadd(`ActiveInstances-${this.censusEnvironment}`, instance.instanceId);
            }
        }

        // Set timer for instances display
        this.activeTimer = setInterval(() => {
            this.printActives();
        }, 60000);

        InstanceAuthority.logger.log('Subscribing to message queues...');
        this.queueAuthority.syncActiveInstances(this.currentInstances);
        await this.queueAuthority.subscribeToActives();

        this.printActives(true);
        InstanceAuthority.logger.debug('Initializing ActiveInstances FINISHED');
        this.initialized = true;
        return true;
    }

    public printActives(mustShow = false): void {
        if (this.currentInstances.length) {
            InstanceAuthority.logger.log('=== Current actives ===');
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
                        outOfPlay: instance.result?.outOfPlay ?? '???',
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
                        outOfPlay: instance.result?.outOfPlay ?? '???',
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
            InstanceAuthority.logger.log('=== Current actives is empty ===');
        }
    }

    private async removeActiveInstance(instance: PS2AlertsInstanceInterface): Promise<void> {
        remove(this.currentInstances, (i) => {
            return i.instanceId === instance.instanceId;
        });

        await this.cacheClient.srem(`ActiveInstances-${this.censusEnvironment}`, instance.instanceId);

        InstanceAuthority.logger.debug(`=== ${instance.instanceId} removed from actives ===`);
    }

    private async startTerritoryControlInstance(instance: MetagameTerritoryInstance, metadata: InstanceMetadataInterface): Promise<boolean> {
        InstanceAuthority.logger.log(`[${instance.instanceId}] Sending instances POST to API ${ps2AlertsApiEndpoints.instances}`);

        let started = new Date();

        await this.ps2AlertsApiClient.post(ps2AlertsApiEndpoints.instances, metadata)
            .then((response) => {
                if (!response.data) {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    throw new ApplicationException(`Unable to create instance via API! Responded with: ${response.data}`, 'InstanceAuthority.startTerritoryControlInstance');
                }
            })
            .catch((err) => {
                InstanceAuthority.logger.error(err.response.data);
                new ExceptionHandler('Unable to create instance via API!', err.response.data.message, 'InstanceAuthority.startTerritoryControlInstance');
            });

        await this.statisticsHandler.logTime(started, MetricTypes.PS2ALERTS_API);

        InstanceAuthority.logger.log(`=== INSERTED NEW METAGAME TERRITORY INSTANCE ${instance.instanceId} ===`);

        // Execute start actions, if it fails trash the instance
        try {
            // Nullify the bracket and hydrate the map records
            await this.instanceActionFactory.buildStart(instance).execute();

            // Now update the initial result record as we have the initial map state
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.instanceActionFactory.buildMetagameTerritoryResult(instance).execute();
        } catch (err) {
            // End early if instance failed to insert, so we don't add an instance to the list of actives.
            if (err instanceof Error) {
                InstanceAuthority.logger.error(`[${instance.instanceId}] Failed to properly run start actions! E: ${err.message}`, 'InstanceAuthority.startTerritoryControlInstance');
            }

            await this.trashInstance(instance);
            return false;
        }

        started = new Date();

        // Mark in the database the alert has now properly started
        await this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.instancesInstance.replace('{instanceId}', instance.instanceId),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            {state: Ps2AlertsEventState.STARTED},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${instance.instanceId}] Unable to mark instance as STARTED! Err: ${err.message}`, 'InstanceAuthority.startTerritoryControlInstance');
        });

        await this.statisticsHandler.logTime(started, MetricTypes.PS2ALERTS_API);

        return true;
    }

    private async startOutfitwarsTerritoryInstance(instance: OutfitWarsTerritoryInstance, metadata: InstanceMetadataInterface): Promise<boolean> {
        InstanceAuthority.logger.log(`[${instance.instanceId}] Sending outfitwars instances POST to API ${ps2AlertsApiEndpoints.outfitwars}`);

        let started = new Date();

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

        await this.statisticsHandler.logTime(started, MetricTypes.PS2ALERTS_API);

        InstanceAuthority.logger.log(`=== INSERTED NEW OUTFIT WARS TERRITORY INSTANCE ${instance.instanceId} ===`);

        // Execute start actions, if it fails trash the instance
        try {
            // Nullify the bracket and hydrate the map records
            await this.instanceActionFactory.buildStart(instance).execute();

            // Now update the initial result record as we have the initial map state
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            await this.instanceActionFactory.buildOutfitwarsResult(instance).execute();
        } catch (err) {
            // End early if instance failed to insert, so we don't add an instance to the list of actives.
            if (err instanceof Error) {
                InstanceAuthority.logger.error(`[${instance.instanceId}] Failed to properly run start actions! E: ${err.message}`, 'InstanceAuthority.startOutfitWarsTerritoryInstance');
            }

            await this.trashInstance(instance);
            return false;
        }

        started = new Date();

        // Mark in the database the alert has now properly started
        await this.ps2AlertsApiClient.patch(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            ps2AlertsApiEndpoints.outfitwarsInstance.replace('{instanceId}', instance.instanceId),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            {state: Ps2AlertsEventState.STARTED},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${instance.instanceId}] Unable to mark instance as STARTED! Err: ${err.message}`, 'InstanceAuthority.startOutfitWarsTerritoryInstance');
        });

        await this.statisticsHandler.logTime(started, MetricTypes.PS2ALERTS_API);

        return true;
    }
}
