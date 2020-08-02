import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';

export default class InstancePopulationData {
    public readonly instance: PS2AlertsInstanceInterface;
    public readonly timestamp: Date;
    public readonly vsPop: number;
    public readonly ncPop: number;
    public readonly trPop: number;
    public readonly nsoPop: number;
    public readonly totalPop: number;

    constructor(
        instance: PS2AlertsInstanceInterface,
        vsPop: number,
        ncPop: number,
        trPop: number,
        nsoPop: number,
        totalPop: number,
    ) {
        this.instance = instance;
        this.timestamp = new Date();
        this.vsPop = vsPop;
        this.ncPop = ncPop;
        this.trPop = trPop;
        this.nsoPop = nsoPop;
        this.totalPop = totalPop;
    }
}
