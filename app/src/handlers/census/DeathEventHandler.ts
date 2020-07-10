import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';

@injectable()
export default class DeathEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('DeathEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public handle(event: GenericEvent): boolean {
        DeathEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            DeathEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        // TODO: Microwave is going to convert Census library to pass through DeathEvent object etc
        try {
            const deathEvent = new DeathEvent(event);
            this.handleDeath(deathEvent);
        } catch (e) {
            if (e instanceof Error) {
                DeathEventHandler.logger.warn(`Error parsing DeathEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                DeathEventHandler.logger.error('UNEXPECTED ERROR parsing DeathEvent!');
            }

            return false;
        }

        return true;
    }

    private handleDeath(deathEvent: DeathEvent): void {
        this.playerHandler.updateLastSeen(deathEvent.worldId, deathEvent.attackerCharacterId);
        this.playerHandler.updateLastSeen(deathEvent.worldId, deathEvent.characterId);

        this.storeEvent(deathEvent);
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private storeEvent(deathEvent: DeathEvent): void {
        // TODO Store in database
    }
}
