import {FormatWrap} from 'logform';
import {format} from 'winston';
import {LogFilter} from '../config/logger';
import {getLevelValue} from './utils/Helpers';

function convertToNumber([label, level]: [string, string | false]): [string, number | false] {
    return [
        label,
        typeof level === 'string' ? getLevelValue(level) : false,
    ];
}

export default function(filter: LogFilter): FormatWrap {
    const map = new Map<string, number | false>(filter.map(convertToNumber));

    return format((info) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const level = map.get(info.label);

        if (level === undefined) {
            return info;
        }

        if (level === false || level < getLevelValue(info.level)) {
            return false;
        }

        return info;
    });
}
