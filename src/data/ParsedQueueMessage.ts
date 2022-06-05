export default class ParsedQueueMessage {
    public readonly type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly data: Record<string, any>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(type: string, data: Record<string, any>) {
        this.type = type;
        this.data = data;
    }
}
