export type PS2Environment = 'ps2' | 'ps2ps2us' | 'ps2ps4eu';

export type PS2ClientSubscription = {
    characters: string[],
    worlds?: string[],
    eventNames: string[]
} | {
    characters?: string[],
    worlds: string[],
    eventNames: string[]
};

export enum WorldsPC {
    connery = 1,
    miller = 10,
    cobalt = 13,
    emerald = 17,
    jaeger = 19,
    // briggs = 25,
    soltech = 40,
}

export enum WorldsPS4US {
    genudine = 1000,
    // palos = 1001,
    // crux = 1002,
    // searhus = 1003,
    // xelas = 1004,
}

export enum WorldsPS4EU {
    ceres = 2000,
    // lithcorp = 2001,
    // rashnu = 2002
}
export enum ClientEvents {
    clientReady = 'ready',
    clientDisconnected = 'disconnected',
    clientReconnecting = 'reconnecting',
    error = 'error',
    warn = 'warn',
    debug = 'debug',
    ps2Event = 'event',
    ps2Duplicate = 'duplicate',
    ps2Subscribed = 'subscribed'
}

export type PS2wsConfig = {
    environment: PS2Environment,
    subscriptions: any[]
};
