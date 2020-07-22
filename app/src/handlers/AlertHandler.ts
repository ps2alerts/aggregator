import {inject, injectable} from 'inversify';
import AlertHandlerInterface from '../interfaces/AlertHandlerInterface';
import MetagameEventEvent from './census/events/MetagameEventEvent';
import {jsonLogOutput} from '../utils/json';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {AlertSchemaInterface} from '../models/AlertModel';
import {MetagameEventState} from '../constants/metagameEventState';
import {getUnixTimestamp} from '../utils/time';
import {alertId} from '../utils/alert';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {TYPES} from '../constants/types';
import ActiveAlertAuthority from '../authorities/ActiveAlertAuthority';

@injectable()
export default class AlertHandler implements AlertHandlerInterface {

    private static readonly logger = getLogger('AlertHandler');

    private readonly factory: MongooseModelFactory<AlertSchemaInterface>;

    private readonly activeAlerts: ActiveAlertAuthority;

    constructor(@inject(TYPES.alertModelFactory) factory: MongooseModelFactory<AlertSchemaInterface>,
                                                 activeAlerts: ActiveAlertAuthority,
    ) {
        this.factory = factory;
        this.activeAlerts = activeAlerts;
    }

    public async handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean> {
        if (mge.eventState === MetagameEventState.STARTED) {
            if (!this.activeAlerts.alertExists(mge.world, mge.zone)) {
                return await this.startAlert(mge);
            } else {
                AlertHandler.logger.error(`Alert already found: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        if (mge.eventState === MetagameEventState.FINISHED) {
            if (this.activeAlerts.alertExists(mge.world, mge.zone)) {
                return await this.endAlert(mge);
            } else {
                AlertHandler.logger.error(`Alert not found: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        throw new ApplicationException(`MetagameEvent was not stored \r\n${jsonLogOutput(mge)}`);
    }

    private async startAlert(mge: MetagameEventEvent): Promise<boolean> {
        AlertHandler.logger.debug('================== STARTING ALERT! ==================');

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const row = await this.factory.saveDocument({
                alertId: alertId(mge),
                world: mge.world,
                zone: mge.zone,
                state: MetagameEventState.STARTED,
                timeStarted: getUnixTimestamp(),
            });
            AlertHandler.logger.info(`================ INSERTED NEW ALERT ${row.alertId} ================`);
            return await this.activeAlerts.addAlert(mge);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert alert into DB! ${err}`);
        }
    }

    private async endAlert(mge: MetagameEventEvent): Promise<boolean> {
        AlertHandler.logger.debug(`================== ENDING ALERT ${alertId(mge)} ==================`);

        // Find alert and update
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const res = await this.factory.model.updateOne(
                {alertId: alertId(mge)},
                {
                    state: MetagameEventState.FINISHED,
                    timeEnded: getUnixTimestamp(),
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!res.nModified) {
                AlertHandler.logger.error(`No alerts were modified on end message! ${alertId(mge)}`);
                return false;
            }

            await this.activeAlerts.endAlert(mge);

            AlertHandler.logger.debug(`================ SUCCESSFULLY ENDED ALERT ${alertId(mge)} ================`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to finish alert ${alertId(mge)}! ${err}`);
        }
    }
}
