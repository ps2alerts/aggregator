/* eslint-disable @typescript-eslint/naming-convention */

export type PS2Environment = 'ps2' | 'ps2ps2us' | 'ps2ps4eu';

export type PS2ClientSubscription = {
    characters: string[];
    worlds?: string[];
    eventNames: string[];
} | {
    characters?: string[];
    worlds: string[];
    eventNames: string[];
};

export enum WorldsPC {
    CONNERY = 1,
    MILLER = 10,
    COBALT = 13,
    EMERALD = 17,
    JAEGER = 19,
    // briggs = 25,
    SOLTECH = 40,
}

export enum WorldsPS4US {
    GENUDINE = 1000,
    // palos = 1001,
    // crux = 1002,
    // searhus = 1003,
    // xelas = 1004,
}

export enum WorldsPS4EU {
    CERES = 2000,
    // lithcorp = 2001,
    // rashnu = 2002,
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
    PS2_SUBSCRIBED = 'subscribed',
}

export interface PS2wsConfig {
    environment: PS2Environment;
    subscriptions: any[];
}
