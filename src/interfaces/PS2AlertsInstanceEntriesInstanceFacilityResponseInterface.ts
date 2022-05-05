import {Faction} from '../constants/faction';

// Longest filename, ever.
export default interface PS2AlertsInstanceEntriesInstanceFacilityResponseInterface {
    instance: string;
    facility: number;
    timestamp: string;
    oldFaction: Faction;
    newFaction: Faction;
    durationHeld: number;
    isDefense: boolean;
    isInitial: boolean;
    outfitCaptured: string;
    mapControl: {
        vs: number;
        nc: number;
        tr: number;
        cutoff: number;
        outOfPlay: number;
    };
}
