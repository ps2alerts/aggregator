import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import BattleRankUpEvent from './events/BattleRankUpEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class BattleRankUpHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('BattleRankUpHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: PS2Event): Promise<boolean>{
        BattleRankUpHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            BattleRankUpHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const battleRankUpEvent = new BattleRankUpEvent(event);
            await this.handleBattleRankUp(battleRankUpEvent);
        } catch (e) {
            if (e instanceof Error) {
                BattleRankUpHandler.logger.warn(`Error parsing BattleRankEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                BattleRankUpHandler.logger.error('UNEXPECTED ERROR parsing BattleRankUp!');
            }

            return false;
        }

        return true;
    }

    private async handleBattleRankUp(battleRankUpEvent: BattleRankUpEvent): Promise<boolean> {
        // Update last seen
        await Promise.all([
            this.playerHandler.updateLastSeen(battleRankUpEvent.worldId, battleRankUpEvent.characterId),
            this.storeEvent(battleRankUpEvent),
        ]);

        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async storeEvent(battleRankUpEvent: BattleRankUpEvent): Promise<boolean> {
        return true;
        // TODO Store in database
    }
}
