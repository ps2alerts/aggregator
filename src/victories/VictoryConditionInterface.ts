import {TerritoryVictoryConditionResultInterface} from './TerritoryVictoryCondition';

export interface VictoryConditionInterface {
    calculate(): Promise<TerritoryVictoryConditionResultInterface>;
}
