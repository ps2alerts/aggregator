const TYPES = {
    redis: Symbol('redis'),

    // Cache Drivers
    censusCharacterCacheDriver: Symbol('censusCharacterCacheDriver'),

    // Handler Interfaces
    populationHandler: Symbol('populationHandler'),

    // Instance Models
    instanceMetagameModelFactory: Symbol('instanceMetagameModelFactory'),

    // Model Factory Symbols
    instanceFacilityControlModelFactory: Symbol('instanceFacilityControlModelFactory'),

    // Aggregates
    // Aggregate Listeners
    deathAggregates: Symbol('deathAggregates'),
    facilityControlAggregates: Symbol('facilityControlAggregates'),
    globalVictoryAggregate: Symbol('globalVictoryAggregate'),
    populationAggregates: Symbol('populationAggregates'),
    vehicleDestroyAggregates: Symbol('vehicleDestroyAggregates'),

    // Message Queue
    rabbitMqConnectionHandlerFactory: Symbol('rabbitMqConnectionHandlerFactory'),
    // Subscribers
    rabbitMQSubscribers: Symbol('rabbitMQSubscribers'),
    // Publishers
    rabbitMQPublishers: Symbol('rabbitMQPublishers'),
    apiMQPublisher: Symbol('apiMQPublisher'),
    apiMQDelayPublisher: Symbol('apiMQDelayPublisher'),
    // Handlers
    adminMessageHandlers: Symbol('adminMessageHandlers'),

    ps2AlertsApiClient: Symbol('ps2AlertsApiClient'),
};

export {TYPES};
