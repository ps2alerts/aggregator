import {inject, injectable} from 'inversify';
import AlertHandlerInterface from '../interfaces/AlertHandlerInterface';
import MetagameEventEvent from './census/events/MetagameEventEvent';
import {jsonLogOutput} from '../utils/json';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {AlertInterface} from '../models/AlertModel';
import {MetagameEventState} from '../constants/metagameEventState';
import {getUnixTimestamp} from '../utils/time';
import {alertId} from '../utils/alert';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {TYPES} from '../constants/types';

interface Alert {
    worldId: number;
    instanceId: number;
}

@injectable()
export default class AlertHandler implements AlertHandlerInterface {

    private static readonly logger = getLogger('AlertHandler');

    private readonly factory: MongooseModelFactory<AlertInterface>;

    private _alerts: Alert[] = [];

    constructor(
    @inject(TYPES.alertModelFactory) factory: MongooseModelFactory<AlertInterface>,
    ) {
        this.factory = factory;
    }

    public async handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean> {
        if (mge.eventState === MetagameEventState.STARTED) {
            if (!this.alertExists(mge)) {
                return await this.startAlert(mge);
            } else {
                AlertHandler.logger.error(`Alert already found: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        if (mge.eventState === MetagameEventState.FINISHED) {
            if (this.alertExists(mge)) {
                return await this.endAlert(mge);
            } else {
                AlertHandler.logger.error(`Alert not found: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        throw new ApplicationException(`MetagameEvent was not stored \r\n${jsonLogOutput(mge)}`);
    }

    private alertExists(mge: MetagameEventEvent): boolean {
        return this._alerts.some((alert) => {
            return alert.worldId === mge.worldId && alert.instanceId === mge.instanceId;
        });
    }

    private async startAlert(mge: MetagameEventEvent): Promise<boolean> {
        AlertHandler.logger.debug('================== STARTING ALERT! ==================');

        this._alerts.push({
            instanceId: mge.instanceId,
            worldId: mge.worldId,
        });

        try {
            const row = await this.factory.saveDocument({
                alertId: alertId(mge),
                world: mge.worldId,
                zone: mge.zone,
                state: MetagameEventState.STARTED,
                timeStarted: getUnixTimestamp(),
            });
            AlertHandler.logger.info(`================ INSERTED NEW ALERT ${row.alertId} ================`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert alert into DB! ${err}`);
        }
    }

    private async endAlert(mge: MetagameEventEvent): Promise<boolean> {
        AlertHandler.logger.debug(`================== ENDING ALERT ${alertId(mge)} ==================`);

        // Remove alert from in-memory list
        this._alerts = this._alerts.filter((alert) => {
            return !(alert.worldId === mge.worldId && alert.instanceId === mge.instanceId);
        });

        // Find alert and update
        try {
            const alertModel = this.factory.model;

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const res = await alertModel.updateOne(
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

            AlertHandler.logger.debug(`================ SUCCESSFULLY ENDED ALERT ${alertId(mge)} ================`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to finish alert ${alertId(mge)}! ${err}`);
        }
    }
}
