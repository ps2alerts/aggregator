import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import ApplicationException from '../../exceptions/ApplicationException';
import {AlertDeathSchemaInterface} from '../../models/AlertDeathModel';
import MongooseModelFactory from '../../factories/MongooseModelFactory';

@injectable()
export default class DeathEventHandler implements EventHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('DeathEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    private readonly factory: MongooseModelFactory<AlertDeathSchemaInterface>;

    /* eslint-disable */
    constructor(
        @inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface,
        @inject(TYPES.alertDeathModelFactory) alertDeathModelFactory: MongooseModelFactory<AlertDeathSchemaInterface>,
    ) {
        /* eslint-enable */
        this.playerHandler = playerHandler;
        this.factory = alertDeathModelFactory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        if (config.features.logging.censusEventContent.deaths) {
            DeathEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await Promise.all([
                this.playerHandler.updateLastSeen(event.world, event.attackerCharacterId),
                this.playerHandler.updateLastSeen(event.world, event.characterId),
                this.storeEvent(event),
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

    private async storeEvent(deathEvent: DeathEvent): Promise<boolean> {
        try {
            await this.factory.saveDocument({
                alert: deathEvent.alert.alertId,
                attacker: deathEvent.attackerCharacterId,
                player: deathEvent.characterId,
                timestamp: deathEvent.timestamp,
                attackerFiremode: deathEvent.attackerFiremodeId,
                attackerLoadout: deathEvent.attackerLoadoutId,
                attackerFaction: deathEvent.attackerFaction,
                weapon: deathEvent.attackerWeaponId,
                playerLoadout: deathEvent.characterLoadoutId,
                playerFaction: deathEvent.characterFaction,
                isHeadshot: deathEvent.isHeadshot,
                isSuicide: deathEvent.isSuicide,
                isTeamkill: deathEvent.isTeamkill,
                vehicle: deathEvent.attackerVehicleId,
            });
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert alert into DB! ${err}`);
        }
    }
}
