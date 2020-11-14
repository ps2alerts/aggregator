import {Faction} from '../constants/faction';
import {FactionNumbersInterface} from './FactionNumbersInterface';

export interface InstanceResultInterface extends FactionNumbersInterface {
    winner: Faction | null;
}
