import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import TerritoryResultInterface from './TerritoryResultInterface';
import {PS2AlertsInstanceFeaturesInterface} from './PS2AlertsInstanceFeaturesInterface';

export default interface PS2AlertsInstanceInterface {
    instanceId: string;
    world: World;
    zone: Zone;
    timeStarted: Date;
    timeEnded: Date | null;
    result: TerritoryResultInterface | null;
    duration: number;
    state: Ps2alertsEventState;
    features?: PS2AlertsInstanceFeaturesInterface;

    overdue(): boolean;

    match(world: World, zone: Zone): boolean;

    currentDuration(): number;
}
