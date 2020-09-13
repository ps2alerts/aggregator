import {World} from '../constants/world';
import {Zone} from '../constants/zone';

export default class PopulationData {
    public readonly world: World;
    public readonly zone: Zone;
    public vs: number;
    public nc: number;
    public tr: number;
    public nso: number;
    public total: number;

    constructor(
        world: World,
        zone: Zone,
        vs: number,
        nc: number,
        tr: number,
        nso: number,
        total: number,
    ) {
        this.world = world;
        this.zone = zone;
        this.vs = vs;
        this.nc = nc;
        this.tr = tr;
        this.nso = nso;
        this.total = total;
    }
}
