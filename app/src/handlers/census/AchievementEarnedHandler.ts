import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import AchievementEarnedEvent from './events/AchievementEarnedEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class AchievementEarnedHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('AchievementEarnedHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PS2Event): Promise<boolean>{
        AchievementEarnedHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            AchievementEarnedHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const achievementEarnedEvent = new AchievementEarnedEvent(event);
            await this.handleAchievementEarned(achievementEarnedEvent);
        } catch (e) {
            if (e instanceof Error) {
                AchievementEarnedHandler.logger.error(`Error parsing AchievementEarnedEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                AchievementEarnedHandler.logger.error('UNKNOWN ERROR parsing AchievementEarnedEvent!');
            }

            return false;
        }

        return true;
    }

    private async handleAchievementEarned(achievementEarnedEvent: AchievementEarnedEvent): Promise<boolean> {
        // Update last seen
        await this.playerHandler.updateLastSeen(achievementEarnedEvent.worldId, achievementEarnedEvent.characterId);
        await this.storeEvent(achievementEarnedEvent);
        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(achievementEarnedEvent: AchievementEarnedEvent): Promise<boolean> {
        return true;
        // TODO Store in database
    }
}
