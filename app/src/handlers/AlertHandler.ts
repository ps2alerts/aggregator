import {inject, injectable} from 'inversify';
import AlertHandlerInterface from '../interfaces/AlertHandlerInterface';
import MetagameEventEvent from './census/events/MetagameEventEvent';
import {jsonLogOutput} from '../utils/json';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {AlertInterface} from '../models/AlertModel';
import {AlertState} from '../constants/alertState';
import {getUnixTimestamp} from '../utils/time';
import MongooseModelFactory from '../factories/MongooseModelFactory';

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
    @inject('AlertModelFactory')
        factory: MongooseModelFactory<AlertInterface>,
    ) {
        this.factory = factory;
    }

    public async handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean> {
        if (mge.eventState === AlertState.STARTED) {
            if (!this.alertExists(mge)) {
                return await this.startAlert(mge);
            } else {
                AlertHandler.logger.error(`Alert already found:${jsonLogOutput(mge)}`);
                return false;
            }
        }

        if (mge.eventState === AlertState.FINISHED) {
            if (this.alertExists(mge)) {
                return this.endAlert(mge);
            } else {
                AlertHandler.logger.error(`Alert not found:${jsonLogOutput(mge)}`);
                return false;
            }
        }

        throw new ApplicationException(`MetagameEvent was not stored \r\n${jsonLogOutput(mge)}`);
    }

    private alertExists(mge: MetagameEventEvent): boolean {
        this._alerts.some((alert) => {
            return alert.worldId === mge.worldId && alert.instanceId === mge.instanceId;
        });
        return false;
    }

    private async startAlert(mge: MetagameEventEvent): Promise<boolean> {
        AlertHandler.logger.debug('================== STARTING ALERT! ==================');
        this._alerts.push({
            instanceId: mge.instanceId,
            worldId: mge.worldId,
        });
        const alert = this.factory.build({
            alertId: `${mge.worldId}-${mge.instanceId}`,
            world: mge.worldId,
            zone: mge.zone,
            state: AlertState.STARTED,
            timeStarted: getUnixTimestamp(),
        });

        AlertHandler.logger.debug('Starting promise...');

        try {
            const row = await alert.save();
            AlertHandler.logger.info(`================ INSERTED NEW ALERT ${row.alertId} ================`);
            return true;
        } catch (err) {
            throw new ApplicationException(`Unable to insert alert into DB! ${err}`);
        }
    }

    private endAlert(mge: MetagameEventEvent): boolean {
        AlertHandler.logger.debug(`================== ENDING ALERT ${mge.worldId}${mge.instanceId} ==================`);
        this._alerts = this._alerts.filter((alert) => {
            return !(alert.worldId === mge.worldId && alert.instanceId === mge.instanceId);
        });
        // TODO Call database
        AlertHandler.logger.debug(`================ SUCCESSFULLY ENDED ALERT ${mge.worldId}${mge.instanceId} ================`);
        return true;
    }
}
