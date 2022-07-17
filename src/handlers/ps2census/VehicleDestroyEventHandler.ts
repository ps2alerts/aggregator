import {injectable, multiInject} from 'inversify';
import {getLogger} from '../../logger';
import {TYPES} from '../../constants/types';
import VehicleDestroyEvent from './events/VehicleDestroyEvent';
import CharacterPresenceHandler from '../CharacterPresenceHandler';
import {VehicleDestroy} from 'ps2census';
import ApplicationException from '../../exceptions/ApplicationException';
import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import CharacterBroker from '../../brokers/CharacterBroker';
import ItemBroker from '../../brokers/ItemBroker';
import {jsonLogOutput} from '../../utils/json';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';

@injectable()
export default class VehicleDestroyEventHandler implements PS2EventQueueMessageHandlerInterface<VehicleDestroy> {
    public readonly eventName = 'VehicleDestroy';
    private static readonly logger = getLogger('VehicleDestroyEvent');

    constructor(
        private readonly characterBroker: CharacterBroker,
        private readonly itemBroker: ItemBroker,
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        @multiInject(TYPES.vehicleDestroyAggregates) private readonly aggregateHandlers: Array<AggregateHandlerInterface<VehicleDestroyEvent>>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: PS2EventQueueMessage<VehicleDestroy>): Promise<boolean> {
        const characters = await this.characterBroker.get(event.payload);

        if (!characters.attacker) {
            throw new ApplicationException('Attacker character did not return!');
        }

        const vehicleDestroyEvent = new VehicleDestroyEvent(
            event,
            characters.character,
            characters.attacker,
        );

        VehicleDestroyEventHandler.logger.silly('=== Processing VehicleDestroy Handlers ===');

        this.aggregateHandlers.map(
            (handler: AggregateHandlerInterface<VehicleDestroyEvent>) => void handler.handle(vehicleDestroyEvent)
                .catch((err: Error) => {
                    VehicleDestroyEventHandler.logger.error(`Error parsing AggregateHandlers for VehicleDestroyEvent: ${err.message}\r\n${jsonLogOutput(event)}`);
                }),
        );

        VehicleDestroyEventHandler.logger.silly('=== VehicleDestroy Handlers Processed! ===');

        return true;
    }
}
