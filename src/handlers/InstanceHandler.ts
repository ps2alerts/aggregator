import {inject, injectable} from 'inversify';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {TYPES} from '../constants/types';
import {World} from '../constants/world';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {Zone} from '../constants/zone';
import {InstanceMetagameSchemaInterface} from '../models/instance/InstanceMetagame';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import {remove} from 'lodash';
import {jsonLogOutput} from '../utils/json';
import InstanceActionFactory from '../factories/InstanceActionFactory';

@injectable()
export default class InstanceHandler implements InstanceHandlerInterface {
    private static readonly logger = getLogger('InstanceHandler');
    private readonly currentInstances: PS2AlertsInstanceInterface[] = [];
    private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>;
    private readonly instanceActionFactory: InstanceActionFactory;
    private initialized = false;

    constructor(
    @inject(TYPES.instanceMetagameModelFactory) instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>,
        @inject(TYPES.instanceActionFactory) instanceActionFactory: InstanceActionFactory,
    ) {
        this.instanceMetagameModelFactory = instanceMetagameModelFactory;
        this.instanceActionFactory = instanceActionFactory;
    }

    public getInstance(instanceId: string): PS2AlertsInstanceInterface {
        InstanceHandler.logger.debug(`Attempting to find an instance with ID: "${instanceId}"...`);

        const instance = this.currentInstances.find((i) => {
            return i.instanceId === instanceId;
        });

        if (!instance) {
            throw new ApplicationException(`Unable to find InstanceID "${instanceId}"!`, 'InstanceHandler');
        }

        InstanceHandler.logger.debug(`Found instance with ID: "${instanceId}"!`);
        InstanceHandler.logger.debug(`${jsonLogOutput(instance)}`);

        return instance;
    }

    public getInstances(world: World, zone: Zone): PS2AlertsInstanceInterface[] {
        return this.currentInstances.filter((instance) => {
            return instance.match(world, zone);
        });
    }

    public getAllInstances(): PS2AlertsInstanceInterface[] {
        return this.currentInstances;
    }

    public async startInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceHandler.logger.info('================== STARTING INSTANCE! ==================');

        if (instance instanceof PS2AlertsMetagameInstance) {
            try {
                const row = await this.instanceMetagameModelFactory.model.create({
                    instanceId: instance.instanceId,
                    world: instance.world,
                    timeStarted: instance.timeStarted,
                    timeEnded: null,
                    zone: instance.zone,
                    censusInstanceId: instance.censusInstanceId,
                    censusMetagameEventType: instance.censusMetagameEventType,
                    duration: instance.duration,
                    state: instance.state,
                });
                InstanceHandler.logger.info(`================ INSERTED NEW INSTANCE ${row.instanceId} ================`);

                // Execute start actions
                await this.instanceActionFactory.buildStart(instance).execute();

                // Add instance to the in-memory data so it can be called upon rapidly without polling DB
                this.currentInstances.push(instance);

                // Show currently running alerts in console / log
                this.printActives();

                return true;
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert instance into DB! ${err}`, 'InstanceHandler');
            }
        }

        // Other types to add eventually

        throw new ApplicationException('Start instance ended unexpectedly!', 'InstanceHandler');
    }

    public async endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceHandler.logger.info(`================== ENDING INSTANCE "${instance.instanceId}" ==================`);

        const done = false;

        // Execute end actions (e.g. calculating territory %)
        await this.instanceActionFactory.buildEnd(instance).execute();

        // Since for some reason the connection manager doesn't throw anything when timing out, handle it here.
        const timeout = new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                clearTimeout(id);

                if (!done) {
                    reject(new Error('Instance end timeout!'));
                } else {
                    resolve();
                }
            }, 5000);
        });

        // Find Instance and update
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const promise = this.instanceMetagameModelFactory.model.updateOne(
                {instanceId: instance.instanceId},
                {
                    state: Ps2alertsEventState.ENDED,
                    timeEnded: new Date(),
                },
            );

            await Promise.race([
                promise,
                timeout,
            ]).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                throw new ApplicationException(err.message);
            });

            remove(this.currentInstances, (i) => {
                return i.instanceId === instance.instanceId;
            });

            InstanceHandler.logger.info(`================ SUCCESSFULLY ENDED INSTANCE "${instance.instanceId}" ================`);
            this.printActives();
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to end instance "${instance.instanceId}"! ${err}`, 'InstanceHandler');
        }
    }

    public async init(): Promise<boolean> {
        InstanceHandler.logger.debug('Initializing ActiveInstances...');

        if (this.initialized) {
            throw new ApplicationException('InstanceHandler was called to be initialized more than once!', 'InstanceHandler');
        }

        let rows: InstanceMetagameSchemaInterface[] = [];

        try {
            rows = await this.instanceMetagameModelFactory.model.find({
                state: Ps2alertsEventState.STARTED,
            }).exec();
        } catch (err) {
            throw new ApplicationException('Unable to retrieve active instances!', 'InstanceHandler');
        }

        if (!rows.length) {
            InstanceHandler.logger.warn('No active instances were detected in the database! This could be entirely normal however.');
        } else {
            rows.forEach((i) => {
                const instance = new PS2AlertsMetagameInstance(
                    i.world,
                    i.timeStarted,
                    null,
                    i.zone,
                    i.censusInstanceId,
                    i.censusMetagameEventType,
                    i.duration,
                    i.state,
                );
                this.currentInstances.push(instance);
            });
        }

        this.printActives();
        InstanceHandler.logger.debug('Initializing ActiveInstances FINISHED');
        this.initialized = true;
        return true;
    }

    public printActives(): void {
        InstanceHandler.logger.info('==== Current actives =====');
        this.currentInstances.forEach((instance: PS2AlertsInstanceInterface) => {
            if (instance instanceof PS2AlertsMetagameInstance) {
                InstanceHandler.logger.info(`I: ${instance.instanceId} | W: ${instance.world} | Z: ${instance.zone}`);
            } else {
                InstanceHandler.logger.info(`I: ${instance.instanceId} | W: ${instance.world}`);
            }

        });

        InstanceHandler.logger.info('==== Current actives end =====');
    }
}
