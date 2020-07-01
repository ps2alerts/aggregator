// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function jsonLogOutput(data: any): string {
    return JSON.stringify(data, null, 4);
}
