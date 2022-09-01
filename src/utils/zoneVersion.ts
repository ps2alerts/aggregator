import {Zone} from '../ps2alerts-constants/zone';

export function getZoneVersion(zone: Zone): string {
    return zone === Zone.OSHUR ? '1.1' : '1.0'; // This will likely change in the future
}
