const TYPES = {
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
    populationAggregates: Symbol.for('populationAggregates'),
    vehicleDestroyAggregates: Symbol.for('vehicleDestroyAggregates'),

    // Message Queue
    rabbitMqConnectionHandlerFactory: Symbol.for('rabbitMqConnectionHandlerFactory'),
    // Subscribers
    rabbitMQSubscribers: Symbol.for('rabbitMQSubscribers'),
    // Publishers
    rabbitMQPublishers: Symbol.for('rabbitMQPublishers'),
    apiMQPublisher: Symbol.for('apiMQPublisher'),
    apiMQDelayPublisher: Symbol.for('apiMQDelayPublisher'),
    // Handlers
    adminMessageHandlers: Symbol.for('adminMessageHandlers'),

    // Other Factories
    instanceActionFactory: Symbol.for('instanceActionFactory'),
    globalVictoryAggregate: Symbol.for('globalVictoryAggregate'),

    instanceAuthority: Symbol.for('instanceAuthority'),
};

export {TYPES};
