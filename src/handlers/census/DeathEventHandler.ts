import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import ApplicationException from '../../exceptions/ApplicationException';
import {InstanceDeathSchemaInterface} from '../../models/instance/InstanceDeathModel';
import MongooseModelFactory from '../../factories/MongooseModelFactory';

@injectable()
export default class DeathEventHandler implements EventHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('DeathEventHandler');

    private readonly factory: MongooseModelFactory<InstanceDeathSchemaInterface>;

    private readonly aggregateHandlers: Array<EventHandlerInterface<DeathEvent>>;

    /* eslint-disable */
    constructor(
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.instanceDeathModelFactory) instanceDeathModelFactory: MongooseModelFactory<InstanceDeathSchemaInterface>,
        @multiInject(TYPES.deathAggregates) aggregateHandlers: EventHandlerInterface<DeathEvent>[]
    ) {
        /* eslint-enable */
        this.factory = instanceDeathModelFactory;
        this.aggregateHandlers = aggregateHandlers;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        DeathEventHandler.logger.silly(jsonLogOutput(event), {message: 'eventData'});

        try {
            await Promise.all([
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

        this.aggregateHandlers.map(
            (handler: EventHandlerInterface<DeathEvent>) => void handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        DeathEventHandler.logger.error(`Error parsing AggregateHandlers for DeathEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        DeathEventHandler.logger.error('UNEXPECTED ERROR parsing DeathEvent AggregateHandlers!');
                    }
                }),
        );

        return true;
    }

    private async storeEvent(event: DeathEvent): Promise<boolean> {
        try {
            await this.factory.model.create({
                instance: event.instance.instanceId,
                attacker: event.attackerCharacter.id,
                character: event.character.id,
                timestamp: event.timestamp,
                attackerFiremode: event.attackerFiremodeId,
                attackerLoadout: event.attackerLoadoutId,
                weapon: event.attackerWeaponId,
                characterLoadout: event.characterLoadoutId,
                isHeadshot: event.isHeadshot,
                killType: event.killType,
                vehicle: event.attackerVehicleId,
            });
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert Instance into DB! ${err}`, 'DeathEventHandler');
            }
        }

        return false;
    }
}
