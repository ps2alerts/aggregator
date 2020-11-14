import {Zone} from './zone';
import {Faction} from './faction';

export interface MetagameDetailsInterface {
    title: string;
    zone: Zone;
    duration: number;
    triggeringFaction: Faction;
    unstable: boolean; // Whether the zone has links disabled, known as Underpowered Warpgate mode.
}
