// Holds data in memory for the active alerts, providing an interface to update them and retrieve them.
// The reason why we don't just use the Alerts collection for this is to save on a TON of queries, as alert existence
// will be checked on every single event.
import {inject, injectable} from 'inversify';
import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';
import ActiveAlertAuthorityInterface from '../interfaces/ActiveAlertAuthorityInterface';
import {TYPES} from '../constants/types';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {ActiveAlertSchemaInterface} from '../models/ActiveAlertModel';
import {alertId} from '../utils/alert';
import ApplicationException from '../exceptions/ApplicationException';
import {getLogger} from '../logger';
import {jsonLogOutput} from '../utils/json';
import ActiveAlertInterface from '../interfaces/ActiveAlertInterface';

@injectable()
export default class ActiveAlertAuthority implements ActiveAlertAuthorityInterface {
    private static readonly logger = getLogger('ActiveAlertAuthority');

    private readonly _activeAlerts: Map<string, ActiveAlertInterface> = new Map<string, ActiveAlertInterface>();

    private readonly factory: MongooseModelFactory<ActiveAlertSchemaInterface>;

    constructor(@inject(TYPES.activeAlertDataModelFactory) activeAlertsModelFactory: MongooseModelFactory<ActiveAlertSchemaInterface>,
    ) {
        this.factory = activeAlertsModelFactory;
        void this.init(); // Hacky mchackface
    }

    public alertExists(world: number, zone: number): boolean {
        return this._activeAlerts.has(this.mapKey(world, zone));
    }

    public getAlert(world: number, zone: number): ActiveAlertInterface {
        const alert = this._activeAlerts.get(this.mapKey(world, zone));

        if (alert) {
            return alert;
        }

        throw new ApplicationException(`Unable to retrieve alert from active list! W: ${world} | Z: ${zone}`, 'ActiveAlertAuthority');
    }

    public async addAlert(mge: MetagameEventEvent): Promise<boolean> {
        this._activeAlerts.set(this.mapKey(mge.world, mge.zone), {
            alertId: alertId(mge),
            instanceId: mge.instanceId,
            world: mge.world,
            zone: mge.zone,
        });

        // Commit to Database to persist between reboots
        try {
            const row = await this.factory.saveDocument({
                alertId: alertId(mge),
                instanceId: mge.instanceId,
                world: mge.world,
                zone: mge.zone,
            });
            ActiveAlertAuthority.logger.info(`Added ActiveAlert record for Alert #${row.alertId} | I:${row.instanceId} | W: ${mge.world} | Z:${mge.zone}`);

            this.printActives();

            return !!this.getAlert(mge.world, mge.zone);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert ActiveAlert into DB! ${err}`, 'ActiveAlertAuthority');
        }
    }

    public async endAlert(mge: MetagameEventEvent): Promise<boolean> {
        // Remove alert from in-memory list
        this._activeAlerts.delete(this.mapKey(mge.world, mge.zone));

        // Remove from database
        try {
            const res = await this.factory.model.deleteOne(
                {alertId: alertId(mge)},
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!res) {
                ActiveAlertAuthority.logger.error(`No alerts were deleted on endAlert! ID: ${alertId(mge)}`);
                return false;
            }

            return !this.getAlert(mge.world, mge.zone);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert alert into DB! ${err}`, 'ActiveAlertAuthority');
        }

    }

    private async init(): Promise<boolean> {
        ActiveAlertAuthority.logger.info('Initializing ActiveAlerts...');
        // Pull the list out of the database and assign to in-memory array
        let res: any[] = [];

        try {
            res = await this.factory.model.find().exec();
        } catch (err) {
            ActiveAlertAuthority.logger.error('Unable to retrieve active alerts!');
        }

        if (!res.length) {
            ActiveAlertAuthority.logger.warn('No active alerts were detected in the database! This could be entirely normal however.');
        } else {
            res.forEach((i) => {
                /* eslint-disable */
                this._activeAlerts.set(this.mapKey(i.world, i.zone), {
                    alertId: i.alertId,
                    instanceId: i.instanceId,
                    world: i.world,
                    zone: i.zone,
                });
                /* eslint-enable */
            });
        }

        ActiveAlertAuthority.logger.info('Initializing ActiveAlerts FINISHED');
        this.printActives();
        return true;
    }

    private printActives(): void {
        ActiveAlertAuthority.logger.info('Current actives:');
        this._activeAlerts.forEach((row: ActiveAlertInterface) => {
            ActiveAlertAuthority.logger.info(jsonLogOutput(row));
        });
    }

    private mapKey(world: number, zone: number): string {
        return `${world}-${zone}`;
    }
}
