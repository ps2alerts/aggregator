const TYPES = {
    // Handler Interfaces
    alertHandlerInterface: Symbol.for('AlertHandlerInterface'),
    playerHandlerInterface: Symbol.for('PlayerHandlerInterface'),

    // Event Handlers
    deathEventHandler: Symbol.for('DeathEventHandler'),

    // Model Factory Symbols
    activeAlertDataModelFactory: Symbol.for('ActiveAlertDataModelFactory'),
    alertModelFactory: Symbol.for('AlertModelFactory'),
    alertDeathModelFactory: Symbol.for('AlertDeathModelFactory'),
    alertFacilityControlModelFactory: Symbol.for('AlertFacilityControlModelFactory'),

    // Aggregates
    // Aggregate Listeners
    deathAggregates: Symbol.for('DeathAggregates'),
    facilityControlAggregates: Symbol.for('FacilityControlAggregates'),

    // Alert Aggregates
    alertClassAggregateFactory: Symbol.for('AlertCLassAggregateFactory'),
    alertFacilityControlAggregateFactory: Symbol.for('AlertFacilityControlAggregateFactory'),
    alertFactionCombatAggregate: Symbol.for('AlertFactionCombatAggregate'),
    alertFactionCombatAggregateFactory: Symbol.for('AlertFactionCombatAggregateFactory'),
    alertPlayerAggregateFactory: Symbol.for('AlertPlayerAggregateFactory'),
    alertWeaponAggregateFactory: Symbol.for('AlertWeaponAggregateFactory'),

    // Global Aggregates
    globalClassAggregateFactory: Symbol.for('GlobalClassAggregateFactory'),
    globalFactionCombatAggregateFactory: Symbol.for('GlobalFactionCombatAggregateFactory'),
    globalPlayerAggregateFactory: Symbol.for('GlobalPlayerAggregateFactory'),
    globalWeaponAggregateFactory: Symbol.for('GlobalWeaponAggregateFactory'),

    // World Aggregates
    worldFacilityControlAggregateFactory: Symbol.for('WorldFacilityControlAggregateFactory'),
};

export {TYPES};
