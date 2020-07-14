import {get} from '../utils/env';
import {PS2ClientSubscription, PS2wsConfig} from '../types/censusStreaming';

export default class Census {
    public readonly serviceID: string = get('CENSUS_SERVICE_ID');

    /**
     * @type {PS2ClientSubscription[]} Subscriptions that are made when starting the websocket
     */
    public readonly subscriptions: PS2ClientSubscription[];

    /**
     * @type {PS2wsConfig} Configuration for PS2 Census websocket
     */
    public readonly ps2WsConfig: PS2wsConfig;

    constructor() {
        this.subscriptions = [{
            eventNames: ['Death'],
            worlds: ['10'],
        }];
        this.ps2WsConfig = {
            environment: 'ps2',
            subscriptions: this.subscriptions,
        };
    }
}
