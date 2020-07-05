import {injectable} from 'inversify';
import AlertHandlerInterface from '../interfaces/AlertHandlerInterface';
import MetagameEventEvent, {MetagameEventState} from './census/events/MetagameEventEvent';
import {jsonLogOutput} from '../utils/json';
import {getLogger} from '../logger';

declare type Alert = {
    worldId: number;
    instanceId: number;
};

@injectable()
export default class AlertHandler implements AlertHandlerInterface {
    private static readonly logger = getLogger('AlertHandler');
    private _alerts: Alert[] = [];

    handleMetagameEvent(mge: MetagameEventEvent): boolean {
        if (mge.eventState === MetagameEventState.started) {
            if (!this.alertExists(mge)) {
                return this.startAlert(mge);
            } else {
                AlertHandler.logger.error('Alert already found:' + jsonLogOutput(mge));
                return false;
            }
        }
        if (mge.eventState === MetagameEventState.ended) {
            if (this.alertExists(mge)) {
                return this.endAlert(mge);
            } else {
                AlertHandler.logger.error('Alert not found:' + jsonLogOutput(mge));
                return false;
            }
        }
        AlertHandler.logger.warn('MetagameEvent was not stored \r\n' + jsonLogOutput(mge));
        return false;
    }

    private alertExists(mge: MetagameEventEvent): boolean {
        this._alerts.some((alert) => {
            return alert.worldId === mge.worldId && alert.instanceId === mge.instanceId;
        });
        return false;
    }

    private startAlert(mge: MetagameEventEvent): boolean {
        AlertHandler.logger.debug('================== STARTING ALERT! ==================');
        this._alerts.push({instanceId: mge.instanceId, worldId: mge.worldId});
        // TODO Call database
        AlertHandler.logger.debug('================ INSERTED NEW ALERT ' + mge.worldId + ' ' + mge.instanceId + ' ================');
        return true;
    }

    private endAlert(mge: MetagameEventEvent): boolean {
        AlertHandler.logger.debug('================== ENDING ALERT! ==================');
        this._alerts = this._alerts.filter((alert) => {
            return !(alert.worldId === mge.worldId && alert.instanceId === mge.instanceId);
        });
        //TODO Call database
        AlertHandler.logger.debug('================ SUCCESSFULLY ENDED ALERT ' + mge.worldId + ' ' + mge.instanceId + ' ================');
        return true;
    }
}
