export interface CalculatorInterface<T> {
    calculate(): Promise<T>;
}
