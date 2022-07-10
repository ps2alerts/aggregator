export default class AdminQueueMessage {
    public readonly type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly body: Record<string, any>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(type: string, body: Record<string, any>) {
        this.type = type;
        this.body = body;
    }
}
