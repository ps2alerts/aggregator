const TYPES = {
    // Configs
    censusConfig: Symbol.for('CensusConfig'),

    // Clients
    pcWebsocketClient: Symbol.for('pcWebsocketClient'),
    ps2ps4euWebsocketClient: Symbol.for('ps2ps4euWebsocketClient'),
    ps2ps4usWebsocketClient: Symbol.for('ps2ps4usWebsocketClient'),

    // Census services
    censusStreamServices: Symbol.for('CensusStreamServices'),
    pcCensusStreamService: Symbol.for('pcCensusStreamService'),
    ps2ps4euCensusStreamService: Symbol.for('ps2ps4euCensusStreamService'),
    ps2ps4usCensusStreamService: Symbol.for('ps2ps4usCensusStreamService'),

    // Census Event Subscriber services
    pcCensusEventSubscriberService: Symbol.for('pcCensusEventSubscriberService'),
    ps2ps4euCensusEventSubscriberService: Symbol.for('ps2ps4euCensusEventSubscriberService'),
    ps2ps4usCensusEventSubscriberService: Symbol.for('ps2ps4usCensusEventSubscriberService'),

    // Authorities
    instanceAuthority: Symbol.for('InstanceAuthority'),
    overdueInstanceAuthority: Symbol.for('OverdueInstanceAuthority'),
    populationAuthority: Symbol.for('PopulationAuthority'),
    pcCensusStaleConnectionWatcherAuthority: Symbol.for('pcCensusStaleConnectionWatcherAuthority'),
    ps2ps4euCensusStaleConnectionWatcherAuthority: Symbol.for('ps2ps4euCensusStaleConnectionWatcherAuthority'),
    ps2ps4usCensusStaleConnectionWatcherAuthority: Symbol.for('ps2ps4usCensusStaleConnectionWatcherAuthority'),

    // Brokers
    pcCharacterBrokerInterface: Symbol.for('pcCharacterBrokerInterface'),
    ps2ps4euCharacterBrokerInterface: Symbol.for('ps2ps4euCharacterBrokerInterface'),
    ps2ps4usCharacterBrokerInterface: Symbol.for('ps2ps4usCharacterBrokerInterface'),
    itemBrokerInterface: Symbol.for('ItemBrokerInterface'),

    // Cache Drivers
    censusCharacterCacheDriver: Symbol.for('CensusCharacterCacheDriver'),

    // Handler Interfaces
    characterPresenceHandler: Symbol.for('CharacterPresenceHandler'),
    populationHandler: Symbol.for('PopulationHandler'),

    // Instance Models
    instanceMetagameModelFactory: Symbol.for('InstanceMetagameModelFactory'),

    // Model Factory Symbols
    instanceFacilityControlModelFactory: Symbol.for('InstanceFacilityControlModelFactory'),

    // Aggregates
    // Aggregate Listeners
    deathAggregates: Symbol.for('DeathAggregates'),
    facilityControlAggregates: Symbol.for('FacilityControlAggregates'),
    populationAggregates: Symbol.for('PopulationAggregates'),
    vehicleDestroyAggregates: Symbol.for('VehicleDestroyAggregates'),

    // Message Queue
    rabbitMqConnectionHandlerFactory: Symbol.for('RabbitMQConnectionHandlerFactory'),
    // Subscribers
    rabbitMQSubscribers: Symbol.for('RabbitMQSubscribers'),
    // Publishers
    rabbitMQPublishers: Symbol.for('RabbitMQPublishers'),
    apiMQPublisher: Symbol.for('ApiMQPublisher'),
    apiMQDelayPublisher: Symbol.for('ApiMQDelayPublisher'),
    // Handlers
    adminMessageHandlers: Symbol.for('adminMessageHandlers'),
    outfitParticipantCacheHandler: Symbol.for('outfitParticipantCacheHandler'),

    // Other Factories
    censusStreamServiceFactory: Symbol.for('CensusStreamServiceFactory'),
    censusEventSubscriberFactory: Symbol.for('CensusEventSubscriberFactory'),
    instanceActionFactory: Symbol.for('InstanceActionFactory'),
    territoryCalculatorFactory: Symbol.for('TerritoryCalculatorFactory'),
    bracketCalculatorFactory: Symbol.for('BracketCalculatorFactory'),
    globalVictoryAggregate: Symbol.for('GlobalVictoryAggregate'),
};

export {TYPES};
