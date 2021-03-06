import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import VehicleDestroyEvent from './events/VehicleDestroyEvent';
import {CensusEnvironment} from '../../types/CensusEnvironment';

@injectable()
export default class VehicleDestroyEventHandler implements EventHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('VehicleDestroyEvent');
    private readonly aggregateHandlers: Array<EventHandlerInterface<VehicleDestroyEvent>>;
    private readonly apiMQPublisher: ApiMQPublisher;

    /* eslint-disable */
    constructor(
        @inject(TYPES.characterPresenceHandler) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @multiInject(TYPES.vehicleDestroyAggregates) aggregateHandlers: EventHandlerInterface<VehicleDestroyEvent>[],
        @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher
    ) {
        /* eslint-enable */
        this.aggregateHandlers = aggregateHandlers;
        this.apiMQPublisher = apiMQPublisher;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: VehicleDestroyEvent, environment: CensusEnvironment): Promise<boolean> {
        VehicleDestroyEventHandler.logger.silly('=== Processing VehicleDestroy Handlers ===');

        this.aggregateHandlers.map(
            (handler: EventHandlerInterface<VehicleDestroyEvent>) => void handler.handle(event, environment)
                .catch((e) => {
                    if (e instanceof Error) {
                        VehicleDestroyEventHandler.logger.error(`Error parsing AggregateHandlers for VehicleDestroyEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        VehicleDestroyEventHandler.logger.error('UNEXPECTED ERROR parsing VehicleDestroy AggregateHandlers!');
                    }
                }),
        );

        VehicleDestroyEventHandler.logger.silly('=== VehicleDestroy Handlers Processed! ===');

        return true;
    }
}
