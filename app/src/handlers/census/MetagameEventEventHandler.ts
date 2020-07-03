/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "event_name":"MetagameEvent",
 "experience_bonus":"",
 "faction_nc":"",
 "faction_tr":"",
 "faction_vs":"",
 "metagame_event_id":"",
 "metagame_event_state":"",
 "timestamp":"",
 "world_id":"",
 "zone_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import MetagameEvent, {MetagameEventState} from './events/MetagameEventEvent';
import MetagameEventEvent from './events/MetagameEventEvent';

declare type Alert = {
    worldId: number;
    instanceId: number;
};

@injectable()
export default class MetagameEventEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('MetagameEventEventHandler');
    private _alerts: Alert[] = [];

    public handle(event: GenericEvent): boolean {
        MetagameEventEventHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            MetagameEventEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const mge = new MetagameEventEvent(event);
            return this.storeEvent(mge);
        } catch (e) {
            MetagameEventEventHandler.logger.warn('Error parsing MetagameEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
    }

    storeEvent(mge: MetagameEventEvent): boolean {
        if (mge.eventState === MetagameEventState.Started) {
            if (!this.alertExists(mge)) {
                return this.startAlert(mge);
            } else {
                MetagameEventEventHandler.logger.error('Alert already found:' + jsonLogOutput(mge));
                return false;
            }
        }
        if (mge.eventState === MetagameEventState.Ended) {
            if (this.alertExists(mge)) {
                return this.endAlert(mge);
            } else {
                MetagameEventEventHandler.logger.error('Alert not found:' + jsonLogOutput(mge));
                return false;
            }
        }
        MetagameEventEventHandler.logger.warn('MetagameEvent was not stored \r\n' + jsonLogOutput(mge));
        return false;
    }

    private alertExists(mge: MetagameEventEvent): boolean {
        this._alerts.some((alert) => {
            return alert.worldId === mge.worldId && alert.instanceId === mge.instanceId;
        });
        return false;
    }

    private startAlert(mge: MetagameEventEvent): boolean {
        MetagameEventEventHandler.logger.debug('================== STARTING ALERT! ==================');
        this._alerts.push({instanceId: mge.instanceId, worldId: mge.worldId});
        // TODO Call database
        MetagameEventEventHandler.logger.debug('================ INSERTED NEW ALERT ' + mge.worldId + ' ' + mge.instanceId + ' ================');
        return true;
    }

    private endAlert(mge: MetagameEventEvent): boolean {
        MetagameEventEventHandler.logger.debug('================== ENDING ALERT! ==================');
        this._alerts = this._alerts.filter((alert) => {
            return !(alert.worldId === mge.worldId && alert.instanceId === mge.instanceId);
        });
        //TODO Call database
        MetagameEventEventHandler.logger.debug('================ SUCCESSFULLY ENDED ALERT ' + mge.worldId + ' ' + mge.instanceId + ' ================');
        return true;
    }
}
