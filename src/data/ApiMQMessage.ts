export default class ApiMQMessage {
    public readonly pattern: string;
    public readonly body: string;

    constructor(pattern: string, body: string) {
        this.pattern = pattern;
        this.body = body;
    }
}
