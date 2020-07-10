import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {GenericEvent} from 'ps2census/dist/client/utils/PS2Events';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import AchievementEarnedEvent from './events/AchievementEarnedEvent';

@injectable()
export default class AchievementEarnedHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('AchievementEarnedHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public handle(event: GenericEvent): boolean {
        AchievementEarnedHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            AchievementEarnedHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const achievementEarnedEvent = new AchievementEarnedEvent(event);
            this.handleAchievementEarned(achievementEarnedEvent);
        } catch (e) {
            if (e instanceof Error) {
                AchievementEarnedHandler.logger.warn(`Error parsing AchievementEarnedEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                AchievementEarnedHandler.logger.error('UNKNOWN ERROR parsing AchievementEarnedEvent!');
            }

            return false;
        }

        return true;
    }

    private handleAchievementEarned(achievementEarnedEvent: AchievementEarnedEvent): void {
        // Update last seen
        this.playerHandler.updateLastSeen(achievementEarnedEvent.worldId, achievementEarnedEvent.characterId);
        this.storeEvent(achievementEarnedEvent);
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private storeEvent(achievementEarnedEvent: AchievementEarnedEvent): void {
        // TODO Store in database
    }
}
