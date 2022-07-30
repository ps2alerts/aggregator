import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import TerritoryResultInterface from './TerritoryResultInterface';
import {Ps2alertsEventType} from '../ps2alerts-constants/ps2alertsEventType';
import {PS2AlertsInstanceFeaturesInterface} from './PS2AlertsInstanceFeaturesInterface';
import {PS2Event} from 'ps2census';

export default interface PS2AlertsInstanceInterface {
    instanceId: string;
    world: World;
    zone: Zone;
    timeStarted: Date;
    timeEnded: Date | null;
    result: TerritoryResultInterface | null;
    duration: number;
    state: Ps2alertsEventState;
    ps2alertsEventType: Ps2alertsEventType;
    features?: PS2AlertsInstanceFeaturesInterface;
    mapVersion?: string;

    overdue(): boolean;

    messageOverdue(event: PS2Event): boolean;

    match(world: World | null, zone: Zone | null): boolean;

    currentDuration(): number;
}
