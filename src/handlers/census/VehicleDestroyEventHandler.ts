import {injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import VehicleDestroyEvent from './events/VehicleDestroyEvent';
import CharacterPresenceHandler from '../CharacterPresenceHandler';

@injectable()
export default class VehicleDestroyEventHandler implements EventHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('VehicleDestroyEvent');

    constructor(
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        @multiInject(TYPES.vehicleDestroyAggregates) private readonly aggregateHandlers: Array<EventHandlerInterface<VehicleDestroyEvent>>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: VehicleDestroyEvent): Promise<boolean> {
        VehicleDestroyEventHandler.logger.silly('=== Processing VehicleDestroy Handlers ===');

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

        VehicleDestroyEventHandler.logger.silly('=== VehicleDestroy Handlers Processed! ===');

        return true;
    }
}
