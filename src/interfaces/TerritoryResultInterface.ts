import {InstanceResultInterface} from './InstanceResultInterface';

export default interface TerritoryResultInterface extends InstanceResultInterface {
    cutoff: number;
    outOfPlay: number;
    draw: boolean;
    perBasePercentage: number;
}
