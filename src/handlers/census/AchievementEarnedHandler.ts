import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import AchievementEarnedEvent from './events/AchievementEarnedEvent';

@injectable()
export default class AchievementEarnedHandler implements EventHandlerInterface<AchievementEarnedEvent> {
    private static readonly logger = getLogger('AchievementEarnedHandler');

    private readonly characterPrecenseHandler: CharacterPresenceHandlerInterface;

    constructor(@inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface) {
        this.characterPrecenseHandler = characterPresenceHandler;
    }

    public async handle(event: AchievementEarnedEvent): Promise<boolean>{
        AchievementEarnedHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            AchievementEarnedHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await Promise.all([
                this.characterPrecenseHandler.update(event.characterId, event.world, event.zone),
                this.storeEvent(event),
            ]);
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

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(achievementEarnedEvent: AchievementEarnedEvent): Promise<boolean> {
        return true;
        // TODO Store in database
    }
}
