import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';

export default class PopulationData {
    constructor(
        public readonly world: World,
        public readonly zone: Zone | number,
        public readonly vs: number,
        public readonly nc: number,
        public readonly tr: number,
        public readonly nso: number,
        public total: number,
    ) {}
}
