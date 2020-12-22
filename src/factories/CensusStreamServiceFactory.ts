import {Client} from 'ps2census';
import {inject} from 'inversify';
import {TYPES} from '../constants/types';
import {CensusEnvironment} from '../types/CensusEnvironment';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import CensusStaleConnectionWatcherAuthority from '../authorities/CensusStaleConnectionWatcherAuthority';
import CensusStream from '../services/census/CensusStream';
import CensusEventSubscriber from '../services/census/CensusEventSubscriber';

export default class CensusStreamServiceFactory {
    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;

    constructor(
    @inject(TYPES.characterPresenceHandler) characterPresenceHandler: CharacterPresenceHandlerInterface,
    ) {
        this.characterPresenceHandler = characterPresenceHandler;
    }

    public build(
        wsClient: Client,
        environment: CensusEnvironment,
        censusEventSubscriber: CensusEventSubscriber,
        censusStaleConnectionWatcherAuthority: CensusStaleConnectionWatcherAuthority,
    ): CensusStream {
        return new CensusStream(
            wsClient,
            environment,
            censusEventSubscriber,
            censusStaleConnectionWatcherAuthority,
            this.characterPresenceHandler,
        );
    }
}
