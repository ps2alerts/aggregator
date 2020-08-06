const TYPES = {
    cacheHandlerFactory: Symbol.for('CacheHandlerFactory'),

    // Authorities
    overdueInstanceAuthority: Symbol.for('OverdueInstanceAuthority'),
    populationAuthority: Symbol.for('PopulationAuthority'),

    // Handler Interfaces
    instanceHandlerInterface: Symbol.for('InstanceHandlerInterface'),
    characterPresenceHandlerInterface: Symbol.for('CharacterPresenceHandlerInterface'),
    populationHandlerInterface: Symbol.for('PopulationHandlerInterface'),

    // Event Handlers
    deathEventHandler: Symbol.for('DeathEventHandler'),

    // Instance Models
    instanceMetagameModelFactory: Symbol.for('InstanceMetagameModelFactory'),
    instanceCustomWorldZoneModelFactory: Symbol.for('InstanceCustomWorldZoneModelFactory'),

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
    instanceFacilityControlAggregateFactory: Symbol.for('InstanceFacilityControlAggregateFactory'),
    instanceFactionCombatAggregateFactory: Symbol.for('InstanceFactionCombatAggregateFactory'),
    instancePopulationAggregateFactory: Symbol.for('InstancePopulationAggregateFactory'),
    instancePlayerAggregateFactory: Symbol.for('InstancePlayerAggregateFactory'),
    instanceWeaponAggregateFactory: Symbol.for('InstanceWeaponAggregateFactory'),

    // Global Aggregates Models
    globalClassAggregateFactory: Symbol.for('GlobalClassAggregateFactory'),
    globalFacilityControlAggregateFactory: Symbol.for('GlobalFacilityControlAggregateFactory'),
    globalFactionCombatAggregateFactory: Symbol.for('GlobalFactionCombatAggregateFactory'),
    globalPlayerAggregateFactory: Symbol.for('GlobalPlayerAggregateFactory'),
    globalWeaponAggregateFactory: Symbol.for('GlobalWeaponAggregateFactory'),

    // Metric Models
    characterPresenceFactory: Symbol.for('CharacterPresenceFactory'),
};

export {TYPES};
