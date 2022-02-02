import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import TerritoryResultInterface from './TerritoryResultInterface';

export default interface PS2AlertsInstanceInterface {
    instanceId: string;
    world: World;
    zone: Zone;
    timeStarted: Date;
    timeEnded: Date | null;
    result: TerritoryResultInterface | null;
    duration: number;
    state: Ps2alertsEventState;

    overdue(): boolean;

    match(world: World, zone: Zone): boolean;
}
