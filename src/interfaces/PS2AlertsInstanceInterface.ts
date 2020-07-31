import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export default interface PS2AlertsInstanceInterface {
    instanceId: string;
    world: World;
    timeStarted: Date;
    timeEnded: Date | null;

    duration(): number;

    overdue(): boolean;

    match(world: World, zone: Zone): boolean;
}
