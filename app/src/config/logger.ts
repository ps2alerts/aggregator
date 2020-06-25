export default class Logger {
    public readonly level: string = process.env.LOG_LEVEL ?? 'info';
}
