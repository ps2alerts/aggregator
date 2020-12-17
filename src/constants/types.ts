const TYPES = {
    // Configs
    censusConfig: Symbol.for('CensusConfig'),

    // Authorities
    overdueInstanceAuthority: Symbol.for('OverdueInstanceAuthority'),
    populationAuthority: Symbol.for('PopulationAuthority'),
    censusStaleConnectionWatcherAuthority: Symbol.for('CensusStaleConnectionWatcherAuthority'),

    // Brokers
    characterBrokerInterface: Symbol.for('CharacterBrokerInterface'),
    itemBrokerInterface: Symbol.for('ItemBrokerInterface'),

    // Cache Drivers
    censusCharacterCacheDriver: Symbol.for('CensusCharacterCacheDriver'),

    // Handler Interfaces
    instanceHandlerInterface: Symbol.for('InstanceHandlerInterface'),
    characterPresenceHandlerInterface: Symbol.for('CharacterPresenceHandlerInterface'),
    populationHandlerInterface: Symbol.for('PopulationHandlerInterface'),

    // Event Handlers
    deathEventHandler: Symbol.for('DeathEventHandler'),

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
    // Handlers
    adminMessageHandlers: Symbol.for('adminMessageHandlers'),

    // Other Factories
    instanceActionFactory: Symbol.for('InstanceActionFactory'),
    territoryCalculatorFactory: Symbol.for('TerritoryCalculatorFactory'),
    bracketCalculatorFactory: Symbol.for('BracketCalculatorFactory'),
    globalVictoryAggregateInterface: Symbol.for('GlobalVictoryAggregateInterface'),
};

export {TYPES};
