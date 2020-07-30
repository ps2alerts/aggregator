const TYPES = {
    // Authorities
    activeInstanceAuthority: Symbol.for('ActiveInstanceAuthority'),
    overdueInstanceAuthority: Symbol.for('OverdueInstanceAuthority'),

    // Handler Interfaces
    instanceHandlerInterface: Symbol.for('InstanceHandlerInterface'),
    playerHandlerInterface: Symbol.for('PlayerHandlerInterface'),

    // Event Handlers
    deathEventHandler: Symbol.for('DeathEventHandler'),

    // Model Factory Symbols
    activeInstanceDataModelFactory: Symbol.for('ActiveInstanceDataModelFactory'),
    instanceModelFactory: Symbol.for('InstanceModelFactory'),
    instanceDeathModelFactory: Symbol.for('InstanceDeathModelFactory'),
    instanceFacilityControlModelFactory: Symbol.for('InstanceFacilityControlModelFactory'),

    // Aggregates
    // Aggregate Listeners
    deathAggregates: Symbol.for('DeathAggregates'),
    facilityControlAggregates: Symbol.for('FacilityControlAggregates'),

    // Instance Aggregates
    instanceClassAggregateFactory: Symbol.for('InstanceClassAggregateFactory'),
    instanceFacilityControlAggregateFactory: Symbol.for('InstanceFacilityControlAggregateFactory'),
    instanceFactionCombatAggregate: Symbol.for('InstanceFactionCombatAggregate'),
    instanceFactionCombatAggregateFactory: Symbol.for('InstanceFactionCombatAggregateFactory'),
    instancePlayerAggregateFactory: Symbol.for('InstancePlayerAggregateFactory'),
    instanceWeaponAggregateFactory: Symbol.for('InstanceWeaponAggregateFactory'),

    // Global Aggregates
    globalClassAggregateFactory: Symbol.for('GlobalClassAggregateFactory'),
    globalFactionCombatAggregateFactory: Symbol.for('GlobalFactionCombatAggregateFactory'),
    globalPlayerAggregateFactory: Symbol.for('GlobalPlayerAggregateFactory'),
    globalWeaponAggregateFactory: Symbol.for('GlobalWeaponAggregateFactory'),

    // World Aggregates
    worldFacilityControlAggregateFactory: Symbol.for('WorldFacilityControlAggregateFactory'),
};

export {TYPES};
