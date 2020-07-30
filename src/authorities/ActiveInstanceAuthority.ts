// Holds data in memory for the active instances, providing an interface to update them and retrieve them.
// The reason why we don't just use the Instances collection for this is to save on a TON of queries, as instance existence
// will be checked on every single event.
import {inject, injectable} from 'inversify';
import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';
import ActiveInstanceAuthorityInterface from '../interfaces/ActiveInstanceAuthorityInterface';
import {TYPES} from '../constants/types';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {ActiveInstanceSchemaInterface} from '../models/ActiveInstanceModel';
import {instanceId} from '../utils/instance';
import ApplicationException from '../exceptions/ApplicationException';
import {getLogger} from '../logger';
import {jsonLogOutput} from '../utils/json';
import ActiveInstanceInterface from '../interfaces/ActiveInstanceInterface';
import OverdueInstanceAuthority from './OverdueInstanceAuthority';

@injectable()
export default class ActiveInstanceAuthority implements ActiveInstanceAuthorityInterface {
    private static readonly logger = getLogger('ActiveInstanceAuthority');

    private readonly _activeInstances: Map<string, ActiveInstanceInterface> = new Map<string, ActiveInstanceInterface>();

    private readonly factory: MongooseModelFactory<ActiveInstanceSchemaInterface>;

    private readonly overdueInstanceAuthority: OverdueInstanceAuthority;

    constructor(
    @inject(TYPES.activeInstanceDataModelFactory) activeInstanceModelFactory: MongooseModelFactory<ActiveInstanceSchemaInterface>,
        @inject(TYPES.overdueInstanceAuthority) overdueInstanceAuthority: OverdueInstanceAuthority,
    ) {
        this.factory = activeInstanceModelFactory;
        this.overdueInstanceAuthority = overdueInstanceAuthority;
        void this.init(); // Hacky mchackface
    }

    public instanceExists(world: number, zone: number): boolean {
        return this._activeInstances.has(ActiveInstanceAuthority.mapKey(world, zone));
    }

    public getInstance(world: number, zone: number): ActiveInstanceInterface {
        const instance = this._activeInstances.get(ActiveInstanceAuthority.mapKey(world, zone));

        if (instance) {
            return instance;
        }

        throw new ApplicationException(`Unable to retrieve Instance from active list! W: ${world} | Z: ${zone}`, 'ActiveInstanceAuthority');
    }

    public getAllInstances(): Map<string, ActiveInstanceInterface> {
        return this._activeInstances;
    }

    public async addInstance(mge: MetagameEventEvent): Promise<boolean> {
        this._activeInstances.set(ActiveInstanceAuthority.mapKey(mge.world, mge.zone), {
            instanceId: instanceId(mge),
            censusInstanceId: mge.instanceId,
            metagameEventType: mge.eventType,
            world: mge.world,
            zone: mge.zone,
            timeStarted: mge.timestamp,
        });

        // Commit to Database to persist between reboots
        try {
            const row = await this.factory.saveDocument({
                instanceId: instanceId(mge),
                censusInstanceId: mge.instanceId,
                metagameEventType: mge.eventType,
                world: mge.world,
                zone: mge.zone,
                timeStarted: mge.timestamp,
            });
            ActiveInstanceAuthority.logger.info(`Added ActiveInstance record for Instance #${row.instanceId} | I:${row.censusInstanceId} | W: ${mge.world} | Z:${mge.zone}`);

            this.printActives();

            return !!this.getInstance(mge.world, mge.zone);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert ActiveInstance into DB! ${err}`, 'ActiveInstanceAuthority');
        }
    }

    public async endInstance(instance: ActiveInstanceInterface): Promise<boolean> {
        // Remove instance from in-memory list
        this._activeInstances.delete(instance.instanceId);

        // Remove from database
        try {
            const res = await this.factory.model.deleteOne(
                {instanceId: instance.instanceId},
            );
            ActiveInstanceAuthority.logger.info(`Deleted instance ID: ${instance.instanceId}`);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!res) {
                ActiveInstanceAuthority.logger.error(`No instances were deleted on endInstance! ID: ${instance.instanceId}`);
                return false;
            }

            return !this.getInstance(instance.world, instance.zone);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert instance into DB! ${err}`, 'ActiveInstanceAuthority');
        }
    }

    private static mapKey(world: number, zone: number): string {
        return `${world}-${zone}`;
    }

    private async init(): Promise<boolean> {
        ActiveInstanceAuthority.logger.debug('Initializing ActiveInstances...');
        // Pull the list out of the database and assign to in-memory array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rows: any[] = [];

        try {
            rows = await this.factory.model.find().exec();
        } catch (err) {
            ActiveInstanceAuthority.logger.error('Unable to retrieve active instances!');
        }

        if (!rows.length) {
            ActiveInstanceAuthority.logger.warn('No active instances were detected in the database! This could be entirely normal however.');
        } else {
            rows.forEach((i) => {
                /* eslint-disable */
                this._activeInstances.set(ActiveInstanceAuthority.mapKey(i.world, i.zone), {
                    instanceId: i.instanceId,
                    censusInstanceId: i.censusInstanceId,
                    metagameEventType: i.metagameEventType,
                    world: i.world,
                    zone: i.zone,
                    timeStarted: i.timeStarted,
                });
                /* eslint-enable */
            });
        }

        ActiveInstanceAuthority.logger.debug('Initializing ActiveInstances FINISHED');
        this.printActives();
        this.overdueInstanceAuthority.run();
        return true;
    }

    private printActives(): void {
        ActiveInstanceAuthority.logger.info('Current actives:');
        this._activeInstances.forEach((row: ActiveInstanceInterface) => {
            ActiveInstanceAuthority.logger.info(jsonLogOutput(row));
        });
    }
}
