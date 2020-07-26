import config from '../../config';
import Transport from 'winston-transport';
import {TransportConfig} from '../../config/logger';
import DiscordTransport from '../DiscordTransport';
import {transports} from 'winston';
import {default as logFilter} from '../filter';

export function filterToArray(filter: Record<string, boolean>): string[] {
    return Object.keys(filter).filter((k) => filter[k]);
}

export function transportFactory(transportList: TransportConfig[]): Transport[] {
    return transportList.map((t) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        const options: any = {...t.options};

        if ('whitelist' in t || 'blacklist' in t) {
            // No idea why this happens, I test that the properties are in t
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            options.format = logFilter(filterToArray(t.whitelist ?? t.blacklist), 'whitelist' in t)();
        }

        switch (t.name) {
            case 'console':
                return new transports.Console(options);
            case 'discord':
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return new DiscordTransport(options);
        }

        throw new Error();
    });
}

export function arrayify<T>(obj: T | T[]): T[] {
    if (Array.isArray(obj)) {
        return obj;
    }

    return [obj];
}

export function getLevelValue(level: string): number {
    const value = config.logger.levels[level];

    if (value === undefined) {
        throw new TypeError(`Encountered unknown level: ${level}`);
    }

    return value;
}
