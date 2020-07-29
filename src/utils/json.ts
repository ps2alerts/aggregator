/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types */
function replacer(name: any, value: any): any {
    if (name === 'client') {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
}

export function jsonLogOutput(data: any): string {
    return JSON.stringify(data, replacer, 4);
}
