/* eslint-disable no-bitwise */
import {Zone} from '../ps2alerts-constants/zone';

export function getZoneIdFromBinary(binaryZoneId: number): Zone {
    return binaryZoneId & 0x0000ffff;
}

export function getZoneInstanceIdFromBinary(binaryZoneId: number): number {
    return (binaryZoneId >> 16) & 0x0000ffff;
}

export function encodeZoneAndInstanceIdToBinary(zone: Zone, instanceId: number): number {
    return zone + (instanceId << 16);
}
