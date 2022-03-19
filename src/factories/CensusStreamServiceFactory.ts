import {CensusClient} from 'ps2census';
import {CensusEnvironment} from '../types/CensusEnvironment';
import CensusStaleConnectionWatcherAuthority from '../authorities/CensusStaleConnectionWatcherAuthority';
import CensusStream from '../services/census/CensusStream';
import CensusEventSubscriber from '../services/census/CensusEventSubscriber';

// TODO: Refactor this so we don't need to build, just call new directly wherever it's used
export default class CensusStreamServiceFactory {
    public build(
        wsClient: CensusClient,
        environment: CensusEnvironment,
        censusEventSubscriber: CensusEventSubscriber,
        censusStaleConnectionWatcherAuthority: CensusStaleConnectionWatcherAuthority,
    ): CensusStream {
        return new CensusStream(
            wsClient,
            environment,
            censusEventSubscriber,
            censusStaleConnectionWatcherAuthority,
        );
    }
}
