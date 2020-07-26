import {get} from '../utils/env';
import {ConsoleTransportOptions} from 'winston/lib/winston/transports';
import {DiscordTransportOptions} from '../logger/DiscordTransport';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface transportsIndex {
    console: ConsoleTransportOptions;
    discord: DiscordTransportOptions;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type transportConfig<K extends keyof transportsIndex = keyof transportsIndex> = {
    name: K;
    options: transportsIndex[K];
} & ({ whitelist?: Record<string, boolean> } | { blacklist?: Record<string, boolean> });

export default class Logger {
    public readonly level = get('LOG_LEVEL', get('NODE_ENV', 'development') === 'development' ? 'debug' : 'info');

    public readonly globalFilter: Record<string, boolean> = {};

    public readonly whitelist: boolean = false;

    public readonly transport: string | string[] = ['console', 'discord'];

    public readonly transports: Record<string, transportConfig> = {
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
