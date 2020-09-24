export interface RabbitMQConnectionAwareInterface {
    connect(): Promise<boolean>;
}
