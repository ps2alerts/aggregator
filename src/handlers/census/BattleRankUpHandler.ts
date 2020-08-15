import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import BattleRankUpEvent from './events/BattleRankUpEvent';

@injectable()
export default class BattleRankUpHandler implements EventHandlerInterface<BattleRankUpEvent> {
    private static readonly logger = getLogger('BattleRankUpHandler');

    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;

    constructor(@inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface) {
        this.characterPresenceHandler = characterPresenceHandler;
    }

    public async handle(event: BattleRankUpEvent): Promise<boolean> {
        BattleRankUpHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            BattleRankUpHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await Promise.all([
                this.characterPresenceHandler.update(event.character, event.zone),
                this.storeEvent(event),
            ]);
        } catch (e) {
            if (e instanceof Error) {
                BattleRankUpHandler.logger.error(`Error parsing BattleRankUpEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                BattleRankUpHandler.logger.error('UNEXPECTED ERROR parsing BattleRankUpEvent!');
            }

            return false;
        }

        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(battleRankUpEvent: BattleRankUpEvent): Promise<boolean> {
        return true;
        // TODO Store in database
    }
}
