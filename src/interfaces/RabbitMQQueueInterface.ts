export interface RabbitMQQueueInterface {
    connect(): Promise<void>;
}
