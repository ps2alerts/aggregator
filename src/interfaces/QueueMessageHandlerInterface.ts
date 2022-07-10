export interface ChannelActionsInterface {
    ack(): void;
    nack(): void;
}

export interface QueueMessageHandlerInterface<T> {
    handle(message: T, actions: ChannelActionsInterface): Promise<void> | void;
}
