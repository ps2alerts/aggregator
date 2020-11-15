import {injectable} from 'inversify';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import BracketCalculator from '../calculators/BracketCalculator';

@injectable()
export default class BracketCalculatorFactory {
    public build(instance: MetagameTerritoryInstance): BracketCalculator {
        return new BracketCalculator(instance);
    }
}
