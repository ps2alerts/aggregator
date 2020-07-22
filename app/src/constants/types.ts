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
    deathAggregates: Symbol.for('DeathAggregates'),
    alertFactionCombatAggregate: Symbol.for('AlertFactionCombatAggregate'),
    alertFactionCombatAggregateFactory: Symbol.for('AlertFactionCombatAggregateFactory'),
};

export {TYPES};
