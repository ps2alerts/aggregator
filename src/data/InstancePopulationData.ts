import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';

export default class InstancePopulationData {
    public readonly instance: PS2AlertsInstanceInterface;
    public readonly timestamp: Date;
    public readonly vs: number;
    public readonly nc: number;
    public readonly tr: number;
    public readonly nso: number;
    public readonly total: number;

    constructor(
        instance: PS2AlertsInstanceInterface,
        vs: number,
        nc: number,
        tr: number,
        nso: number,
        total: number,
    ) {
        this.instance = instance;
        this.timestamp = new Date();
        this.vs = vs;
        this.nc = nc;
        this.tr = tr;
        this.nso = nso;
        this.total = total;
    }
}
