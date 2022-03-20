import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export default class PopulationData {
    constructor(
        public readonly world: World,
        public readonly zone: Zone,
        public readonly vs: number,
        public readonly nc: number,
        public readonly tr: number,
        public readonly nso: number,
        public total: number,
    ) {}
}
