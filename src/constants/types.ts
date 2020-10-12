const TYPES = {
    // Authorities
    overdueInstanceAuthority: Symbol.for('OverdueInstanceAuthority'),
    populationAuthority: Symbol.for('PopulationAuthority'),
    censusStaleConnectionWatcherAuthority: Symbol.for('CensusStaleConnectionWatcherAuthority'),

    // Brokers
    characterBrokerInterface: Symbol.for('CharacterBrokerInterface'),

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
    instanceDeathModelFactory: Symbol.for('InstanceDeathModelFactory'),
    instanceFacilityControlModelFactory: Symbol.for('InstanceFacilityControlModelFactory'),

    // Aggregates
    // Aggregate Listeners
    deathAggregates: Symbol.for('DeathAggregates'),
    facilityControlAggregates: Symbol.for('FacilityControlAggregates'),
    populationAggregates: Symbol.for('PopulationAggregates'),
    vehicleDestroyAggregates: Symbol.for('VehicleDestroyAggregates'),

    // Instance Aggregates Models
    instanceClassAggregateFactory: Symbol.for('InstanceClassAggregateFactory'),
    instanceCharacterAggregateFactory: Symbol.for('InstanceCharacterAggregateFactory'),
    instanceFacilityControlAggregateFactory: Symbol.for('InstanceFacilityControlAggregateFactory'),
    instanceFactionCombatAggregateFactory: Symbol.for('InstanceFactionCombatAggregateFactory'),
    instanceOutfitAggregateFactory: Symbol.for('InstanceOutfitAggregateFactory'),
    instancePopulationAggregateFactory: Symbol.for('InstancePopulationAggregateFactory'),
    instanceWeaponAggregateFactory: Symbol.for('InstanceWeaponAggregateFactory'),

    // Global Aggregates Models
    globalCharacterAggregateFactory: Symbol.for('GlobalCharacterAggregateFactory'),
    globalClassAggregateFactory: Symbol.for('GlobalClassAggregateFactory'),
    globalFacilityControlAggregateFactory: Symbol.for('GlobalFacilityControlAggregateFactory'),
    globalFactionCombatAggregateFactory: Symbol.for('GlobalFactionCombatAggregateFactory'),
    globalOutfitAggregateFactory: Symbol.for('GlobalOutfitAggregateFactory'),
    globalWeaponAggregateFactory: Symbol.for('GlobalWeaponAggregateFactory'),

    // Metric Models
    characterPresenceFactory: Symbol.for('CharacterPresenceFactory'),

    // Message Queue
    rabbitMqConnectionHandlerFactory: Symbol.for('RabbitMQConnectionHandlerFactory'),
    // Subscribers
    rabbitMQSubscribers: Symbol.for('RabbitMQSubscribers'),
    adminAggregatorSubscriber: Symbol.for('AdminAggregatorSubscriber'),
    // Publishers
    rabbitMQPublishers: Symbol.for('RabbitMQPublishers'),
    apiMQPublisher: Symbol.for('ApiMQPublisher'),
    // Handlers
    adminMessageHandlers: Symbol.for('adminMessageHandlers'),

    // Other Factories
    instanceActionFactory: Symbol.for('InstanceActionFactory'),
};

export {TYPES};
