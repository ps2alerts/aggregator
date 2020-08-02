export default interface PopulationHandlerInterface<I> {
    handle(event: I): Promise<boolean>;
}
