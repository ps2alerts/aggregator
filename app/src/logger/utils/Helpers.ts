import Transport from 'winston-transport';
import {transportConfig} from '../../config/logger';
import DiscordTransport from '../DiscordTransport';
import {transports} from 'winston';

export function filterToArray(filter: Record<string, boolean>): string[] {
    return Object.keys(filter).filter((k) => filter[k]);
}

export function transportFactory(transportList: transportConfig[]): Transport[] {
    return transportList.map((t) => {
        // TODO: Add filter per transport
        switch (t.name) {
            case 'console':
                return new transports.Console(t.options);
            case 'discord':
                // Fucking hell, why are you both so dumb
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return new DiscordTransport(t.options);
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
