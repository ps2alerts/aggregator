import {get, getAndTest} from '../utils/env';
import {censusEnvironments} from '../ps2alerts-constants/censusEnvironments';
import {CensusEnvironment} from '../types/CensusEnvironment';

export default class Census {
    public readonly serviceID: string = get('CENSUS_SERVICE_ID');
    public readonly censusEnvironment: CensusEnvironment = this.getCensusEnvironment();
    public readonly metagameCreationsEnabled = true; // if false, will simply ack the messages and not action / create metagames from them

    public getCensusEnvironment(): CensusEnvironment {
        return getAndTest('CENSUS_ENVIRONMENT', (v) => Object.values(censusEnvironments).includes(v));
    }
}
