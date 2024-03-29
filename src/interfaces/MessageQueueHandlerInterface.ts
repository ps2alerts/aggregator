export default interface MessageQueueHandlerInterface<T> {
    handle(message: T): Promise<boolean>;
}
