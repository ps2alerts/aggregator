const TYPES = {
    // Authorities
    activeAlertAuthority: Symbol.for('ActiveAlertAuthority'),

    // Handler Interfaces
    alertHandlerInterface: Symbol.for('AlertHandlerInterface'),
    playerHandlerInterface: Symbol.for('PlayerHandlerInterface'),

    // Event Handlers
    deathEventHandler: Symbol.for('DeathEventHandler'),

    // Model Factory Symbols
    activeAlertDataModelFactory: Symbol.for('ActiveAlertDataModelFactory'),
    alertModelFactory: Symbol.for('AlertModelFactory'),
    alertDeathModelFactory: Symbol.for('AlertDeathModelFactory'),
};

export {TYPES};
