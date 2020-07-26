import {TransformableInfo} from 'logform';

export default function(list: string[], whitelist: boolean): (info: TransformableInfo) => TransformableInfo | boolean {
    const sl = new Set(list);

    if (whitelist) {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        return (info) => (sl.has(info.label) ? info : false);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    return (info) => (sl.has(info.label) ? false : info);
}
