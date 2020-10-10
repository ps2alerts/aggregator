import {MetagameTerritoryResult} from './TerritoryVictoryCondition';

export interface VictoryConditionInterface {
    calculate(): Promise<MetagameTerritoryResult>;
}
