import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger, getLogsEnabled} from '../../logger';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import {jsonLogOutput} from '../../utils/json';
import AchievementEarnedEvent from './events/AchievementEarnedEvent';

@injectable()
export default class AchievementEarnedHandler implements EventHandlerInterface<AchievementEarnedEvent> {
    private static readonly logger = getLogger('AchievementEarnedHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: AchievementEarnedEvent): Promise<boolean>{
        AchievementEarnedHandler.logger.debug('Parsing message...');

        if (getLogsEnabled().censusEventContent.achievementEarned) {
            AchievementEarnedHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await this.handleAchievementEarned(event);
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
        await this.playerHandler.updateLastSeen(achievementEarnedEvent.world, achievementEarnedEvent.characterId);
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
