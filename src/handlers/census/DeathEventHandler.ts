import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import CharacterPresenceHandler from '../CharacterPresenceHandler';

@injectable()
export default class DeathEventHandler implements EventHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('DeathEventHandler');

    constructor(
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        @multiInject(TYPES.deathAggregates) private readonly aggregateHandlers: Array<EventHandlerInterface<DeathEvent>>,
        @inject(TYPES.apiMQPublisher) private readonly apiMQPublisher: ApiMQPublisher,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: DeathEvent): Promise<boolean> {
        DeathEventHandler.logger.silly(jsonLogOutput(event), {message: 'eventData'});

        // try {
        //     await Promise.all([
        //         this.storeEvent(event),
        //     ]);
        // } catch (e) {
        //     if (e instanceof Error) {
        //         DeathEventHandler.logger.error(`Error parsing DeathEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
        //     } else {
        //         DeathEventHandler.logger.error('UNEXPECTED ERROR parsing DeathEvent!');
        //     }
        //
        //     return false;
        // }

        DeathEventHandler.logger.silly('=== Processing DeathEvent Handlers ===');

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

        DeathEventHandler.logger.silly('=== DeathEvent Handlers Processed! ===');

        return true;
    }

    // private async storeEvent(event: DeathEvent): Promise<boolean> {
    //     try {
    //         await this.apiMQPublisher.send(new ApiMQMessage(
    //             MqAcceptedPatterns.INSTANCE_DEATH,
    //             [{
    //                 instance: event.instance.instanceId,
    //                 attacker: event.attackerCharacter ? event.attackerCharacter : undefined,
    //                 character: event.character,
    //                 timestamp: event.timestamp,
    //                 attackerFiremode: event.attackerFiremodeId,
    //                 attackerLoadout: event.attackerLoadoutId,
    //                 weapon: event.attackerWeapon,
    //                 characterLoadout: event.characterLoadoutId,
    //                 isHeadshot: event.isHeadshot,
    //                 killType: event.killType,
    //                 vehicle: event.attackerVehicleId,
    //             }],
    //         ));
    //         return true;
    //     } catch (err) {
    //         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    //         throw new ApplicationException(`Unable to pass Death to API! E: ${err}`, 'DeathEventHandler');
    //     }
    // }
}
