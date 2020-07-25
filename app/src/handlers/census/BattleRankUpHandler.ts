import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger, getLogsEnabled} from '../../logger';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import {jsonLogOutput} from '../../utils/json';
import BattleRankUpEvent from './events/BattleRankUpEvent';

@injectable()
export default class BattleRankUpHandler implements EventHandlerInterface<BattleRankUpEvent> {
    private static readonly logger = getLogger('BattleRankUpHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: BattleRankUpEvent): Promise<boolean>{
        BattleRankUpHandler.logger.debug('Parsing message...');

        if (getLogsEnabled().censusEventContent.battleRankUp) {
            BattleRankUpHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await this.handleBattleRankUp(event);
        } catch (e) {
            if (e instanceof Error) {
                BattleRankUpHandler.logger.error(`Error parsing BattleRankEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
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
            this.playerHandler.updateLastSeen(battleRankUpEvent.world, battleRankUpEvent.characterId),
            this.storeEvent(battleRankUpEvent),
        ]);

        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(battleRankUpEvent: BattleRankUpEvent): Promise<boolean> {
        return true;
        // TODO Store in database
    }
}
