import {TerritoryResultInterface} from './TerritoryCalculator';

export interface CalculatorInterface {
    calculate(): Promise<TerritoryResultInterface>;
}
