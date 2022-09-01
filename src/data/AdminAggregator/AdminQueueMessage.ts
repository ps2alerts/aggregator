/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment */
export default class AdminQueueMessage {
    public readonly action: string;
    public readonly type: string;
    public readonly body: Record<string, any>;

    constructor(payload: Record<string, any>) {
        this.action = payload.action;
        this.body = payload.body;
    }
}
