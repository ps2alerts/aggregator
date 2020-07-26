import {FormatWrap} from 'logform';
import {format} from 'winston';

export default function(list: string[], whitelist: boolean): FormatWrap {
    const sl = new Set(list);

    if (whitelist) {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        return format((info) => (sl.has(info.label) ? info : false));
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    return format((info) => (sl.has(info.label) ? false : info));
}
