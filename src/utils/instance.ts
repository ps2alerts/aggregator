import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';

// eslint-disable-next-line no-shadow
export function instanceId(world: World, zone: Zone, identifer: number): string {

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${world}-${zone}-${identifer}`;
}
