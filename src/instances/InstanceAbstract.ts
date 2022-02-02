import {World} from '../constants/world';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

export default abstract class InstanceAbstract {
    public readonly instanceId: string;
    public readonly world: World;
    public readonly timeStarted: Date;
    public timeEnded: Date | null;
    public result: TerritoryResultInterface | null;

    protected constructor(
        instanceId: string,
        world: World,
        timeStarted: Date,
        timeEnded: Date | null,
        result: TerritoryResultInterface | null,
    ) {
        this.instanceId = instanceId;
        this.world = world;
        this.timeStarted = timeStarted;
        this.timeEnded = timeEnded;
        this.result = result;
    }
}
