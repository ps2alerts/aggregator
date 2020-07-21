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
import ActiveAlertAuthorityInterface from '../../interfaces/ActiveAlertAuthorityInterface';

@injectable()
export default class DeathEventHandler implements EventHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('DeathEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    private readonly alertDeathModelFactory: MongooseModelFactory<AlertDeathSchemaInterface>;

    private readonly activeAlerts: ActiveAlertAuthorityInterface;

    constructor(
    @inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface,
        @inject(TYPES.alertDeathModelFactory) alertDeathModelFactory: MongooseModelFactory<AlertDeathSchemaInterface>,
        @inject(TYPES.activeAlertAuthority) activeAlertAuthority: ActiveAlertAuthorityInterface,
    ) {
        this.playerHandler = playerHandler;
        this.alertDeathModelFactory = alertDeathModelFactory;
        this.activeAlerts = activeAlertAuthority;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        DeathEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
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
        console.log(deathEvent);

        try {
            const row = await this.alertDeathModelFactory.saveDocument({
                alert: deathEvent.alert.alertId,
                attacker: deathEvent.attackerCharacterId,
                player: deathEvent.characterId,
                timestamp: deathEvent.timestamp,
                attackerFiremode: deathEvent.attackerFiremodeId,
                attackerLoadout: deathEvent.attackerLoadoutId,
                weapon: deathEvent.attackerWeaponId,
                playerLoadout: deathEvent.characterLoadoutId,
                isHeadshot: deathEvent.isHeadshot,
                isSuicide: deathEvent.isSuicide,
                vehicle: deathEvent.attackerVehicleId,
            });
            // DeathEventHandler.logger.info(`================ INSERTED NEW ALERT ${row.alertId} ================`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert alert into DB! ${err}`);
        }

        return true;
    }
}
