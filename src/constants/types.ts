const TYPES = {
    // Configs
    censusConfig: Symbol.for('censusConfig'),

    // Brokers
    characterBroker: Symbol.for('characterBroker'),
    itemBroker: Symbol.for('itemBroker'),
    facilityDataBroker: Symbol.for('facilityDataBroker'),

    // Cache Drivers
    censusCharacterCacheDriver: Symbol.for('censusCharacterCacheDriver'),

    // Handler Interfaces
    characterPresenceHandler: Symbol.for('characterPresenceHandler'),
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
    outfitParticipantCacheHandler: Symbol.for('outfitParticipantCacheHandler'),

    // Other Factories
    instanceActionFactory: Symbol.for('instanceActionFactory'),
    territoryCalculatorFactory: Symbol.for('territoryCalculatorFactory'),
    globalVictoryAggregate: Symbol.for('globalVictoryAggregate'),
};

export {TYPES};
