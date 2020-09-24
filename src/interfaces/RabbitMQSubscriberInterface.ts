export interface RabbitMQSubscriberInterface {
    subscribe(): Promise<boolean>;
}
