import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import {Ps2AlertsEventState} from '../ps2alerts-constants/ps2AlertsEventState';
import TerritoryResultInterface from '../ps2alerts-constants/interfaces/TerritoryResultInterface';
import {Ps2AlertsEventType} from '../ps2alerts-constants/ps2AlertsEventType';
import {PS2AlertsInstanceFeaturesInterface} from '../ps2alerts-constants/interfaces/PS2AlertsInstanceFeaturesInterface';
import {PS2Event} from 'ps2census';

export default interface PS2AlertsInstanceInterface {
    instanceId: string;
    world: World;
    zone: Zone;
    timeStarted: Date;
    timeEnded: Date | null;
    result: TerritoryResultInterface | null;
    duration: number;
    state: Ps2AlertsEventState;
    ps2AlertsEventType: Ps2AlertsEventType;
    features?: PS2AlertsInstanceFeaturesInterface;
    mapVersion?: string;

    overdue(): boolean;

    messageOverdue(event: PS2Event<any>): boolean;

    match(world: World | null, zone: Zone | null): boolean;

    currentDuration(): number;
}
