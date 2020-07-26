import { get } from '../utils/env';
import { ConsoleTransportOptions } from 'winston/lib/winston/transports';
import { DiscordTransportOptions } from '../logger/DiscordTransport';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface transports {
    console: ConsoleTransportOptions;
    discord: DiscordTransportOptions;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
type transport<K extends keyof transports = keyof transports> = {
    name: K;
    options: transports[K];
} & ({ whitelist?: Record<string, boolean> } | { blacklist?: Record<string, boolean> });

export default class Logger {
    public readonly level = get('LOG_LEVEL', get('NODE_ENV', 'development') === 'development' ? 'debug' : 'info');

    public readonly globalFilter: Record<string, boolean> = {};

    public readonly transport: string | string[] = ['console', 'discord'];

    public readonly transports: Record<string, transport> = {
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
