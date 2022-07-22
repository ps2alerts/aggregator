export interface ChannelActionsInterface {
    ack(): void;
    retry(): void;
    delay(ms: number): void;
}

export interface QueueMessageHandlerInterface<T> {
    handle(message: T, actions: ChannelActionsInterface): Promise<void> | void;
}
