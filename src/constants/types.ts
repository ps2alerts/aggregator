const TYPES = {
    // Authorities
    activeInstanceAuthority: Symbol.for('ActiveInstanceAuthority'),
    overdueInstanceAuthority: Symbol.for('OverdueInstanceAuthority'),

    // Handler Interfaces
    instanceHandlerInterface: Symbol.for('InstanceHandlerInterface'),
    playerHandlerInterface: Symbol.for('PlayerHandlerInterface'),
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
};

export {TYPES};
