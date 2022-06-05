const TYPES = {
    redis: Symbol.for('redis'),

    // Cache Drivers
    censusCharacterCacheDriver: Symbol.for('censusCharacterCacheDriver'),

    // Handler Interfaces
    populationHandler: Symbol.for('populationHandler'),

    // Instance Models
    instanceMetagameModelFactory: Symbol.for('instanceMetagameModelFactory'),

    // Model Factory Symbols
    instanceFacilityControlModelFactory: Symbol.for('instanceFacilityControlModelFactory'),

    // Aggregates
    // Aggregate Listeners
    deathAggregates: Symbol.for('deathAggregates'),
    facilityControlAggregates: Symbol.for('facilityControlAggregates'),
    globalVictoryAggregate: Symbol.for('globalVictoryAggregate'),
    playerFacilityAggregates: Symbol.for('playerFacilityAggregates'),
    populationAggregates: Symbol.for('populationAggregates'),
    vehicleDestroyAggregates: Symbol.for('vehicleDestroyAggregates'),

    // Message Queue
    rabbitMqConnectionHandlerFactory: Symbol.for('rabbitMqConnectionHandlerFactory'),
    // Subscribers
    rabbitMQSubscribers: Symbol.for('rabbitMQSubscribers'),
    // Publishers
    rabbitMQPublishers: Symbol.for('rabbitMQPublishers'),
    // Handlers
    adminMessageHandlers: Symbol.for('adminMessageHandlers'),

    ps2AlertsApiClient: Symbol.for('ps2AlertsApiClient'),
};

export {TYPES};
