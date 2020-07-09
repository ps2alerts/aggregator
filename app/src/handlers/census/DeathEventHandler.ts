import { inject, injectable } from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { getLogger } from '../../logger';
import config from '../../config';
import { jsonLogOutput } from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import { TYPES } from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';


@injectable()
export default class DeathEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('DeathEventHandler');

    constructor(
        @inject(TYPES.PlayerHandlerInterface) private playerHandler: PlayerHandlerInterface
    ) {
    }

    public handle(event: GenericEvent): boolean {
        DeathEventHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            DeathEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const deathEvent = new DeathEvent(event);
            this.handleDeath(deathEvent);
        } catch (e) {
            DeathEventHandler.logger.warn('Error parsing DeathEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }

    private handleDeath(deathEvent: DeathEvent) {
        this.playerHandler.updateLastSeen(deathEvent.worldId, deathEvent.attackerCharacterId);
        this.playerHandler.updateLastSeen(deathEvent.worldId, deathEvent.characterId);

        this.storeEvent(deathEvent);
    }

    private storeEvent(deathEvent: DeathEvent) {
        // TODO store in database
    }
}
