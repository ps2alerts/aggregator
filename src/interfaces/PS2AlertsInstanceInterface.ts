import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
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
    mapVersion?: string;

    overdue(): boolean;

    messageOverdue(timestamp: Date): boolean;

    match(world: World | null, zone: Zone | null): boolean;

    currentDuration(): number;
}
