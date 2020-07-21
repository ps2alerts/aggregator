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

    private _activeAlerts: ActiveAlertInterface[] = [];

    private readonly factory: MongooseModelFactory<ActiveAlertSchemaInterface>;

    constructor(
    @inject(TYPES.activeAlertDataModelFactory) activeAlertsModelFactory: MongooseModelFactory<ActiveAlertSchemaInterface>,
    ) {
        this.factory = activeAlertsModelFactory;
        void this.init();
    }

    public getAlert(world: number, zone: number): ActiveAlertInterface {
        const foundAlert = this._activeAlerts.filter((alert) => {
            return alert.world === world && alert.zone === zone;
        });

        if (!foundAlert) {
            throw new ApplicationException(`Unable to find the alert for W: ${world} | Z: ${zone}`);
        }

        if (foundAlert.length > 1) {
            throw new ApplicationException(`Multiple ActiveAlerts were returned for W: ${world} | Z: ${zone} which shouldn't be possible!`);
        }

        console.log(foundAlert);

        process.exit(2);

        return foundAlert[0];
    }

    public async addAlert(mge: MetagameEventEvent): Promise<boolean> {
        this._activeAlerts.push({
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

            return this.exists(mge);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert ActiveAlert into DB! ${err}`, 'ActiveAlertAuthority');
        }
    }

    public async endAlert(mge: MetagameEventEvent): Promise<boolean> {
        // Remove alert from in-memory list
        this._activeAlerts = this._activeAlerts.filter((alert) => {
            return !(alert.world === mge.world && alert.instanceId === mge.instanceId);
        });

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

            return !this.exists(mge);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert alert into DB! ${err}`, 'ActiveAlertAuthority');
        }

    }

    public exists(mge: MetagameEventEvent): boolean {
        return this._activeAlerts.some((alert) => {
            return alert.world === mge.world && alert.instanceId === mge.instanceId;
        });
    }

    private async init(): Promise<boolean> {
        ActiveAlertAuthority.logger.info('Initializing ActiveAlerts...');
        // Pull the list out of the database and assign to in-memory array
        let res: any[] = [];

        try {
            res = await this.factory.model.find();
        } catch (err) {
            ActiveAlertAuthority.logger.error('Unable to retrieve active alerts!');
        }

        if (!res.length) {
            ActiveAlertAuthority.logger.warn('No active alerts were detected in the database! This could be entirely normal however.');
        } else {
            res.forEach((i) => {
                /* eslint-disable */
                this._activeAlerts.push({
                    alertId: alertId(null, i.world, i.instanceId),
                    instanceId: i.instanceId,
                    world: i.world,
                    zone: i.zone,
                });
                /* eslint-enable */
            });
        }

        // Check the current "In Progress" alerts, and ensure they match

        ActiveAlertAuthority.logger.info('Initializing ActiveAlerts FINISHED');
        this.printActives();
        return true;
    }

    private printActives(): void {
        ActiveAlertAuthority.logger.info('Current actives:');
        ActiveAlertAuthority.logger.info(jsonLogOutput(this._activeAlerts));
    }
}
