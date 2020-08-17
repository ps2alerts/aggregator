export interface MessageQueueChannelWrapperInterface {
    subscribe(): Promise<boolean>;
}
