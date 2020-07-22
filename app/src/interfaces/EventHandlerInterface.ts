export default interface EventHandlerInterface<I> {
    handle(event: I): Promise<boolean>;
}
