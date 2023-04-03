import {get, getAndTest} from '../utils/env';
import {censusEnvironments} from '../ps2alerts-constants/censusEnvironments';
import {CensusEnvironment} from '../types/CensusEnvironment';

export default class Census {
    public readonly serviceID: string = get('CENSUS_SERVICE_ID');
    public readonly censusEnvironment: CensusEnvironment = this.getCensusEnvironment();
    public readonly metagameQueuesEnabled = true; // false == don't subscribe to the queues (used for non-authority aggregators)
    public readonly metagameCreationsEnabled = true; // false == don't create alerts but ack them in the queues

    public getCensusEnvironment(): CensusEnvironment {
        return getAndTest('CENSUS_ENVIRONMENT', (v) => Object.values(censusEnvironments).includes(v));
    }
}
