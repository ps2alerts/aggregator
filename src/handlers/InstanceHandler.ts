import {inject, injectable} from 'inversify';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';
import MetagameEventEvent from './census/events/MetagameEventEvent';
import {jsonLogOutput} from '../utils/json';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {MetagameEventState} from '../constants/metagameEventState';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {TYPES} from '../constants/types';
import {World} from '../constants/world';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {Zone} from '../constants/zone';
import {InstanceMetagameSchemaInterface} from '../models/instance/InstanceMetagame';
import {InstanceCustomWorldZoneSchemaInterface} from '../models/instance/InstanceCustomWorldZone';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import _ from 'lodash';

@injectable()
export default class InstanceHandler implements InstanceHandlerInterface {

    private static readonly logger = getLogger('InstanceHandler');

    private readonly currentInstances: PS2AlertsInstanceInterface[] = [];

    private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>;

    private readonly instanceCustomWorldZoneInstanceModelFactory: MongooseModelFactory<InstanceCustomWorldZoneSchemaInterface>;

    private initialized = false;

    constructor(
    @inject(TYPES.instanceMetagameModelFactory) instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>,
        @inject(TYPES.instanceCustomWorldZoneModelFactory) instanceCustomWorldZoneInstanceModelFactory: MongooseModelFactory<InstanceCustomWorldZoneSchemaInterface>,
    ) {
        this.instanceMetagameModelFactory = instanceMetagameModelFactory;
        this.instanceCustomWorldZoneInstanceModelFactory = instanceCustomWorldZoneInstanceModelFactory;
    }

    public async handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean> {
        const instances = this.getInstances(mge.world, mge.zone);

        if (instances.length > 1) {
            throw new ApplicationException(`Multiple instances detected when there should only be one! \r\n${jsonLogOutput(mge)}`, 'InstanceHandler');
        }

        if (mge.eventState === MetagameEventState.STARTED) {
            if (instances.length === 0) {
                const ps2alertsInstance = new PS2AlertsMetagameInstance(
                    mge.world,
                    mge.timestamp,
                    null,
                    mge.zone,
                    mge.instanceId,
                    mge.eventType,
                    Ps2alertsEventState.STARTED,
                );
                return await this.startInstance(ps2alertsInstance);
            } else {
                this.printActives();
                InstanceHandler.logger.error(`Instance already exists: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        if (mge.eventState === MetagameEventState.FINISHED) {
            if (instances[0]) {
                return await this.endInstance(instances[0]);
            } else {
                InstanceHandler.logger.error(`Instance not found: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        throw new ApplicationException(`MetagameEvent was not stored \r\n${jsonLogOutput(mge)}`, 'InstanceHandler');
    }

    public getInstances(world: World, zone: Zone): PS2AlertsInstanceInterface[] {
        return _.filter(this.currentInstances, (instance) => {
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
                    state: instance.state,
                });
                InstanceHandler.logger.info(`================ INSERTED NEW INSTANCE ${row.instanceId} ================`);
                this.currentInstances.push(instance);
                this.printActives();
                return true;
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert instance into DB! ${err}`, 'InstanceHandler');
            }
        }

        return false;
    }

    public async endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceHandler.logger.info(`================== ENDING INSTANCE ${instance.instanceId} ==================`);

        // Find Instance and update
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const res = await this.instanceMetagameModelFactory.model.updateOne(
                {instanceId: instance.instanceId},
                {
                    state: Ps2alertsEventState.ENDED,
                    timeEnded: new Date(),
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!res.nModified) {
                InstanceHandler.logger.error(`No instances were modified on end message! ${instance.instanceId}`);
                return false;
            }

            _.remove(this.currentInstances, (i) => {
                if (i instanceof PS2AlertsMetagameInstance) {
                    return instance.match(i.world, i.zone);
                }
            });

            InstanceHandler.logger.info(`================ SUCCESSFULLY ENDED INSTANCE ${instance.instanceId} ================`);
            this.printActives();
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to end instance ${instance.instanceId}! ${err}`, 'InstanceHandler');
        }
    }

    public async init(): Promise<boolean> {
        InstanceHandler.logger.debug('Initializing ActiveInstances...');

        if (this.initialized) {
            throw new ApplicationException('InstanceHandler was called to be initized more than once!', 'InstanceHandler');
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

    private printActives(): void {
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
