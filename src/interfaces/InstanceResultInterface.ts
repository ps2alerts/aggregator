import {Faction} from '../ps2alerts-constants/faction';
import {FactionNumbersInterface} from './FactionNumbersInterface';

export interface InstanceResultInterface extends FactionNumbersInterface {
    victor: Faction | null;
}
