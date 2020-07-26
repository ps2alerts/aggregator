import {get} from '../utils/env';
import {ConsoleTransportOptions} from 'winston/lib/winston/transports';
import {DiscordTransportOptions} from '../logger/DiscordTransport';

export interface TransportsIndex {
    console: ConsoleTransportOptions;
    discord: DiscordTransportOptions;
}

export type TransportConfig<K extends keyof TransportsIndex = keyof TransportsIndex> = {
    name: K;
    options: TransportsIndex[K];
} & ({ whitelist?: Record<string, boolean> } | { blacklist?: Record<string, boolean> });

export default class Logger {
    public readonly level = get('LOG_LEVEL', get('NODE_ENV', 'development') === 'development' ? 'debug' : 'info');

    public readonly globalFilter: Record<string, boolean> = {};

    public readonly whitelist: boolean = false;

    public readonly transport: string | string[] = ['console', 'discord'];

    public readonly transports: Record<string, TransportConfig> = {
        console: {
            name: 'console',
            options: {},
        },
        discord: {
            name: 'discord',
            options: {
                webhookUrl: get('LOGGER_DISCORD_WEBHOOK'),
            },
        },
    };
}
