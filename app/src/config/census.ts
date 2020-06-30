import { get } from '../utils/env';
import { PS2ClientSubscription, PS2wsConfig } from '../types/censusStreaming';

export default class Census {
    // public readonly serviceID: string = get('CENSUS_SERVICE_ID')
    public readonly serviceID: string = 'planetside2alertstats'

    /**
     * @type {SubscribeAction[]} Subscriptions that are made when starting the websocket
     */
    public readonly subscriptions: Array<PS2ClientSubscription> = [{
        eventNames: ['Death'],
        characters: ['all'],
        worlds: ['10'],
    }];

    /**
     * @type {PS2wsConfig} Configuration for PS2 Census websocket
     */
    public readonly ps2WsConfig: PS2wsConfig = {
        environment: 'ps2',
        subscriptions: this.subscriptions,
    };
}
