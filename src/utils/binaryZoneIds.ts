/* eslint-disable no-bitwise */
import {Zone} from '../ps2alerts-constants/zone';

export function getZoneIdFromBinary(binaryZoneId: number): Zone {
    return binaryZoneId & 0x0000ffff;
}

export function getZoneInstanceIdFromBinary(binaryZoneId: number): number {
    return binaryZoneId >> 16;
}

export function encodeZoneAndInstanceIdToBinary(zone: Zone, instanceId: number): number {
    return zone + instanceId * 2 ^ (8 * 4);
}
