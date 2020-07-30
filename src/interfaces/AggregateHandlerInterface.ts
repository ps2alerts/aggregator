import EventHandlerInterface from './EventHandlerInterface';

export default interface AggregateHandlerInterface<I> extends EventHandlerInterface<I> {
    handle(event: I): Promise<boolean>;
}
