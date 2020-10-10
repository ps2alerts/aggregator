import {World} from '../constants/world';

export default abstract class InstanceAbstract {
    public readonly instanceId: string;
    public readonly world: World;
    public readonly timeStarted: Date;
    public timeEnded: Date | null;

    protected constructor(
        instanceId: string,
        world: World,
        timeStarted: Date,
        timeEnded: Date | null,

    ) {
        this.instanceId = instanceId;
        this.world = world;
        this.timeStarted = timeStarted;
        this.timeEnded = timeEnded;
    }
}
