export default class ParsedQueueMessage {
    public type: string;
    public readonly data: string;

    constructor(type: string, data: string) {
        this.type = type;
        this.data = data;
    }
}
