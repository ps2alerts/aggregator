const TYPES = {
    // Authorities
    activeAlertAuthority: Symbol.for('ActiveAlertAuthority'),

    // Handler Interfaces
    alertHandlerInterface: Symbol.for('AlertHandlerInterface'),
    playerHandlerInterface: Symbol.for('PlayerHandlerInterface'),

    // Model Factory Symbols
    activeAlertDataModelFactory: Symbol.for('ActiveAlertDataModelFactory'),
    alertModelFactory: Symbol.for('AlertModelFactory'),
    alertDeathModelFactory: Symbol.for('AlertDeathModelFactory'),
};

export {TYPES};
