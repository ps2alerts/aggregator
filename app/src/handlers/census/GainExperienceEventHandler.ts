import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import GainExperienceEvent from './events/GainExperienceEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class GainExperienceEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('GainExperienceHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public handle(event: PS2Event): boolean {
        GainExperienceEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            GainExperienceEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const gainExperienceEvent = new GainExperienceEvent(event);
            this.handleExperienceEvent(gainExperienceEvent);
        } catch (e) {
            if (e instanceof Error) {
                GainExperienceEventHandler.logger.warn(`Error parsing GainExperienceEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                GainExperienceEventHandler.logger.error('UNEXPECTED ERROR parsing GainExperienceEvent!');
            }

            return false;
        }

        return true;
    }

    private handleExperienceEvent(gainExperienceEvent: GainExperienceEvent): void {
        // Update last seen
        this.playerHandler.updateLastSeen(gainExperienceEvent.worldId, gainExperienceEvent.characterId);
        return this.storeEvent(gainExperienceEvent);
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private storeEvent(gainExperienceEvent: GainExperienceEvent): void {
        // TODO Save to database
    }
}
