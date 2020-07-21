import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import {PS2Event} from 'ps2census';
import ApplicationException from '../../exceptions/ApplicationException';
import {AlertDeathInterface} from '../../models/AlertDeathModel';
import MongooseModelFactory from '../../factories/MongooseModelFactory';

@injectable()
export default class DeathEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('DeathEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    private readonly alertDeathModelFactory: MongooseModelFactory<AlertDeathInterface>;

    constructor(
    @inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface,
        @inject(TYPES.alertDeathModelFactory) alertDeathModelFactory: MongooseModelFactory<AlertDeathInterface>,
    ) {
        this.playerHandler = playerHandler;
        this.alertDeathModelFactory = alertDeathModelFactory;
    }

    public async handle(event: PS2Event): Promise<boolean> {
        DeathEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            DeathEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const deathEvent = new DeathEvent(event);
            await Promise.all([
                this.playerHandler.updateLastSeen(deathEvent.worldId, deathEvent.attackerCharacterId),
                this.playerHandler.updateLastSeen(deathEvent.worldId, deathEvent.characterId),
                this.storeEvent(deathEvent),
            ]);
        } catch (e) {
            if (e instanceof Error) {
                DeathEventHandler.logger.error(`Error parsing DeathEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                DeathEventHandler.logger.error('UNEXPECTED ERROR parsing DeathEvent!');
            }

            return false;
        }

        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(deathEvent: DeathEvent): Promise<boolean> {
        return true;
    }
}
