import {World} from '../ps2alerts-constants/world';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

export default abstract class InstanceAbstract {
    protected constructor(
        public readonly instanceId: string, // 10-12345
        public readonly world: World,
        public readonly timeStarted: Date,
        public readonly timeEnded: Date | null,
        public readonly result: TerritoryResultInterface | null,
    ) {}
}
