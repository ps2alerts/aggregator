import {get} from '../utils/env';
import {config} from 'winston';
import {ConsoleTransportOptions} from 'winston/lib/winston/transports';
import {DiscordTransportOptions} from '../logger/DiscordTransport';

export type LogFilter = Array<[string, string | false]>;

export interface TransportsIndex {
    console: ConsoleTransportOptions;
    discord: DiscordTransportOptions;
}

export interface TransportConfig<K extends keyof TransportsIndex = keyof TransportsIndex> {
    name: K;
    options: TransportsIndex[K];
    filter?: LogFilter;
}

export default class Logger {
    public readonly levels = config.npm.levels;

    public readonly level = get('LOG_LEVEL', get('NODE_ENV', 'development') === 'development' ? 'debug' : 'info');

    public readonly globalFilter: LogFilter = [];

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
                level: 'info',
            },
            filter: [
                ['GlobalClassAggregate', false],
                ['GlobalFactionCombatAggregate', false],
                ['GlobalPlayerAggregate', false],
                ['GlobalWeaponAggregate', false],
            ],
        },
    };
}
