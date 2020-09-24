const TYPES = {
    // Authorities
    overdueInstanceAuthority: Symbol.for('OverdueInstanceAuthority'),
    populationAuthority: Symbol.for('PopulationAuthority'),

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

    // Message Queues
    messageQueueSubscribers: Symbol.for('MessageQueueSubscribers'),
    mqAdminMessage: Symbol.for('MQAdminMessage'),

    // Factories
    instanceActionFactory: Symbol.for('InstanceActionFactory'),

    // RabbitMQ
    rabbitMqConnectionHandlerFactory: Symbol.for('RabbitMQConnectionHandlerFactory'),
};

export {TYPES};
