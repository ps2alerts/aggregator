// This takes a zoneID and ensures we're actually getting the proper one out, as in various places zone_id is referenced but OW ids are coming out...
import {Zone, zoneArray} from '../ps2alerts-constants/zone';
import Parser from './parser';
import {getZoneIdFromBinary} from './binaryZoneIds';

// eslint-disable-next-line @typescript-eslint/naming-convention
export function getRealZoneId(zone_id: string): Zone {
    const zoneId = Parser.parseNumericalArgument(zone_id);

    // If not a proper zone ID (e.g. ZoneInstance ID) returned the parsed version of it
    if (!zoneArray.includes(zoneId)) {
        return getZoneIdFromBinary(zoneId);
    }

    return zoneId;
}
