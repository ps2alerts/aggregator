export type PS2Environment = 'ps2' | 'ps2ps2us' | 'ps2ps4eu';

export type PS2ClientSubscription = {
    characters: string[],
    worlds?: string[],
    eventNames: string[]
} | {
    characters?: string[],
    worlds: string[],
    eventNames: string[]
}

export enum State {
    IDLE,
    CONNECTING,
    NEARLY,
    RECONNECTING,
    READY,
    DISCONNECTED
}

export enum WorldsPC {
    CONNERY = 1,
    MILLER = 10,
    COBALT = 13,
    EMERALD = 17,
    JAEGER = 19,
    // BRIGGS = 25,
    SOLTECH = 40,
}

export enum WorldsPS4US {
    GENUDINE = 1000,
    // PALOS = 1001,
    // CRUX = 1002,
    // SEARHUS = 1003,
    // XELAS = 1004,
}

export enum WorldsPS4EU {
    CERES = 2000,
    // LITHCORP = 2001,
    // RASHNU = 2002
}
export enum ClientEvents {
    CLIENT_READY = 'ready',
    CLIENT_DISCONNECTED = 'disconnected',
    CLIENT_RECONNECTING = 'reconnecting',
    ERROR = 'error',
    WARN = 'warn',
    DEBUG = 'debug',
    PS2_EVENT = 'event',
    PS2_DUPLICATE = 'duplicate',
    PS2_SUBSCRIBED = 'subscribed'
}

export type PS2wsConfig = {
    environment: PS2Environment,
    subscriptions: any[]
};
