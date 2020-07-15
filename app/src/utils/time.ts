export function getUnixTimestamp(): number {
    return Math.round((new Date()).getTime() / 1000);
}
