export default abstract class ApiMQRabbitMessage {
    public readonly pattern: string;

    protected constructor(pattern: string) {
        this.pattern = pattern;
    }
}
