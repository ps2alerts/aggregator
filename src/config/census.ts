import {get} from '../utils/env';
import {ClientConfig, EventStreamManagerConfig, EventStreamSubscription} from 'ps2census';

export default class Census {
    public readonly serviceID: string = get('CENSUS_SERVICE_ID');

    /**
     * @type {EventStreamSubscription[]} Subscriptions that are made when starting the aggregator
     */
    public readonly subscriptions: EventStreamSubscription[];

    /**
     * @type {ClientConfig} Configuration for PS2 Census aggregator client
     */
    public readonly clientConfig: ClientConfig;

    /**
     * @type {EventStreamManagerConfig} Configuration for event stream subscriptions
     */
    public readonly streamManagerConfig: EventStreamManagerConfig;

    public readonly enableInjections: boolean;

    constructor() {
        this.subscriptions = [{
            eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience'],
            worlds: ['all'],
            characters: ['all'],
            logicalAndCharactersWithWorlds: true,
        }];
        this.clientConfig = {
            environment: 'ps2',
            serviceId: this.serviceID,
            streamManagerConfig: this.streamManagerConfig,
        };
        this.streamManagerConfig = {
            subscriptions: this.subscriptions,
        };
        this.enableInjections = get('NODE_ENV', 'development') === 'development';
    }
}
