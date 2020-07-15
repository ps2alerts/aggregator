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
