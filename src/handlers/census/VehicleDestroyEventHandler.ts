import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import ApplicationException from '../../exceptions/ApplicationException';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage from '../../data/ApiMQMessage';
import {Ps2alertsApiMQEndpoints} from '../../constants/ps2alertsApiMQEndpoints';
import VehicleDestroyEvent from './events/VehicleDestroyEvent';

@injectable()
export default class VehicleDestroyEventHandler implements EventHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('VehicleDestroyEvent');
    private readonly aggregateHandlers: Array<EventHandlerInterface<VehicleDestroyEvent>>;
    private readonly apiMQPublisher: ApiMQPublisher;

    /* eslint-disable */
    constructor(
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @multiInject(TYPES.vehicleDestroyAggregates) aggregateHandlers: EventHandlerInterface<VehicleDestroyEvent>[],
        @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher
    ) {
        /* eslint-enable */
        this.aggregateHandlers = aggregateHandlers;
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: VehicleDestroyEvent): Promise<boolean> {
        VehicleDestroyEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});

        // try {
        //     await Promise.all([
        //         this.storeEvent(event),
        //     ]);
        // } catch (e) {
        //     if (e instanceof Error) {
        //         VehicleDestroyEventHandler.logger.error(`Error parsing VehicleDestroyEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
        //     } else {
        //         VehicleDestroyEventHandler.logger.error('UNEXPECTED ERROR parsing VehicleDestroy!');
        //     }
        //
        //     return false;
        // }

        VehicleDestroyEventHandler.logger.debug('=== Processing VehicleDestroy Handlers ===');

        this.aggregateHandlers.map(
            (handler: EventHandlerInterface<VehicleDestroyEvent>) => void handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        VehicleDestroyEventHandler.logger.error(`Error parsing AggregateHandlers for VehicleDestroyEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        VehicleDestroyEventHandler.logger.error('UNEXPECTED ERROR parsing VehicleDestroy AggregateHandlers!');
                    }
                }),
        );

        VehicleDestroyEventHandler.logger.debug('=== VehicleDestroy Handlers Processed! ===');

        return true;
    }

    // private async storeEvent(event: VehicleDestroyEvent): Promise<boolean> {
    //     try {
    //         await this.apiMQPublisher.send(new ApiMQMessage(
    //             Ps2alertsApiMQEndpoints.INSTANCE_VEHICLE_DESTROY,
    //
    //             [{
    //                 instance: event.instance.instanceId,
    //                 attacker: event.attackerCharacter ? event.attackerCharacter.id : '0',
    //                 character: event.character.id,
    //                 timestamp: event.timestamp,
    //                 attackerFiremode: event.attackerFiremodeId,
    //                 attackerLoadout: event.attackerLoadoutId,
    //                 weapon: event.attackerWeaponId,
    //                 characterLoadout: event.characterLoadoutId,
    //                 isHeadshot: event.isHeadshot,
    //                 killType: event.killType,
    //                 vehicle: event.attackerVehicleId,
    //             }],
    //         ));
    //         return true;
    //     } catch (err) {
    //         // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    //         throw new ApplicationException(`Unable to pass Death to API! E: ${err}`, 'VehicleDestroyEvent');
    //     }
    // }
}
