import {World} from '../constants/world';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

export default abstract class InstanceAbstract {
    protected constructor(
        public readonly instanceId: string,
        public readonly world: World,
        public readonly timeStarted: Date,
        public readonly timeEnded: Date | null,
        public readonly result: TerritoryResultInterface | null,
    ) {}
}
