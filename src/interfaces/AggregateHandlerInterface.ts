export default interface AggregateHandlerInterface<T> {
    handle(event: T): Promise<boolean>;
}
