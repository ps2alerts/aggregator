import {inject, injectable} from 'inversify';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';
import MetagameEventEvent from './census/events/MetagameEventEvent';
import {jsonLogOutput} from '../utils/json';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {InstanceSchemaInterface} from '../models/InstanceModel';
import {MetagameEventState} from '../constants/metagameEventState';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {TYPES} from '../constants/types';
import {World} from '../constants/world';
import PS2AlertsInstanceInterface from '../instances/PS2AlertsInstanceInterface';
import PS2AlertsInstanceAbstract from '../instances/PS2AlertsInstanceAbstract';
import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {Zone} from '../constants/zone';
import {InstanceMetagameSchemaInterface} from '../models/instance/InstanceMetagame';
import {InstanceCustomWorldZoneSchemaInterface} from '../models/instance/InstanceCustomWorldZone';

@injectable()
export default class InstanceHandler implements InstanceHandlerInterface {

    private static readonly logger = getLogger('InstanceHandler');

    /*
    Structure:
    [
        0, => PS2AlertsMetagameInstance
        1, => PS2AlertsMetagameInstance
        2, => PS2AlertsCustomWorldZoneInstance
    ]
     */
    private readonly currentInstances: PS2AlertsInstanceInterface[] = [];

    private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>;
    private readonly instanceCustomWorldZoneInstanceModelFactory: MongooseModelFactory<InstanceCustomWorldZoneSchemaInterface>;

    constructor(
    @inject(TYPES.instanceMetagameModelFactory) instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>,
        @inject(TYPES.instanceCustomWorldZoneModelFactory) instanceCustomWorldZoneInstanceModelFactory: MongooseModelFactory<InstanceCustomWorldZoneSchemaInterface>,
    ) {
        this.instanceMetagameModelFactory = instanceMetagameModelFactory;
        this.instanceCustomWorldZoneInstanceModelFactory = instanceCustomWorldZoneInstanceModelFactory;
        this.init();
    }

    public async handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean> {
        const instances = this.getInstances(mge.world, mge.zone);

        if (instances.length > 1) {
            throw new ApplicationException(`Multiple instances detected when there should only be one! \r\n${jsonLogOutput(mge)}`);
        }

        if (mge.eventState === MetagameEventState.STARTED) {
            if (instances.length === 1) {
                const ps2alertsInstance = new PS2AlertsMetagameInstance(
                    mge.world,
                    mge.timestamp,
                    null,
                    mge.zone,
                    mge.instanceId,
                    mge.eventType,
                    mge.eventState,
                );
                return await this.startInstance(ps2alertsInstance);
            } else {
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

        throw new ApplicationException(`MetagameEvent was not stored \r\n${jsonLogOutput(mge)}`);
    }

    public getInstances(world: World, zone: Zone): PS2AlertsInstanceInterface[] {
        return this.currentInstances.filter((instance) => instance.match(world, zone));
    }

    public getAllInstances(): PS2AlertsInstanceInterface[] {
        return this.currentInstances;
    }

    public async startInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceHandler.logger.info('================== STARTING INSTANCE! ==================');

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const row = await this.factory.model.create({
                instanceId: instance.instanceId,
                eventType: instance.eventType,
                metagameInstanceId: instance.metagameInstanceId,
                subEventType: instance.subEventType,
                world: instance.world,
                zone: instance.zone,
                state: instance.state,
                timeStarted: instance.timeStarted,
                timeEnded: null,
            });
            InstanceHandler.logger.info(`================ INSERTED NEW INSTANCE ${row.instanceId} ================`);
            this.printActives();
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert instance into DB! ${err}`);
        }
    }

    public async endInstance(instance: PS2AlertsInstanceInterface): Promise<boolean> {
        InstanceHandler.logger.info(`================== ENDING INSTANCE ${instance.instanceId} ==================`);

        // Find Instance and update
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const res = await this.factory.model.updateOne(
                {instanceId: instance.instanceId},
                {
                    state: MetagameEventState.FINISHED,
                    timeEnded: new Date(),
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!res.nModified) {
                InstanceHandler.logger.error(`No instances were modified on end message! ${instance.instanceId}`);
                return false;
            }

            this.activeInstances.delete(instance.instanceId);

            InstanceHandler.logger.info(`================ SUCCESSFULLY ENDED INSTANCE ${instance.instanceId} ================`);
            this.printActives();
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to finish instance ${instance.instanceId}! ${err}`);
        }
    }

    private async init(): Promise<boolean> {
        InstanceHandler.logger.debug('Initializing ActiveInstances...');
        // Pull the list out of the database and assign to in-memory array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rows: InstanceSchemaInterface[] = [];

        try {
            rows = await this.factory.model.find().exec();
        } catch (err) {
            InstanceHandler.logger.error('Unable to retrieve active instances!');
        }

        if (!rows.length) {
            InstanceHandler.logger.warn('No active instances were detected in the database! This could be entirely normal however.');
        } else {
            rows.forEach((i) => {
                const instance = new PS2AlertsInstanceAbstract(
                    i.eventType,
                    i.metagameInstanceId,
                    i.metagameEventType,
                    i.world,
                    i.zone,
                    i.state,
                    i.timeStarted,
                );
                /* eslint-disable */
                this.activeInstances.set(i.instanceId, instance);
                /* eslint-enable */
            });
        }

        InstanceHandler.logger.debug('Initializing ActiveInstances FINISHED');
        this.printActives();
        this.overdueInstanceAuthority.run();
        return true;
    }

    private printActives(): void {
        InstanceHandler.logger.info('Current actives:');
        this.activeInstances.forEach((instance: PS2AlertsInstanceInterface) => {
            InstanceHandler.logger.info(`I: ${instance.instanceId} | W: ${instance.world} | Z: ${instance.zone}`);
        });
    }
}
