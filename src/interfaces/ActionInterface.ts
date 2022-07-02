export interface ActionInterface<T> {
    execute(): Promise<T>;
}
