const TYPES = {
    redis: Symbol.for('redis'),

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

    rabbitMqConnection: Symbol('RabbitMQConnection'),
    // Subscribers
    rabbitMQSubscribers: Symbol('rabbitMQSubscribers'),
    // Publishers
    rabbitMQPublishers: Symbol('rabbitMQPublishers'),

    ps2AlertsApiClient: Symbol('ps2AlertsApiClient'),

    // Census Message Handlers
    eventInstanceHandlers: Symbol('eventInstanceHandlers'),
};

export {TYPES};
