import {Inject, Injectable, Logger} from '@nestjs/common';
import {TYPES} from '../../constants/types';
import VehicleDestroyEvent from './events/VehicleDestroyEvent';
import CharacterPresenceHandler from '../CharacterPresenceHandler';
import {VehicleDestroy} from 'ps2census';
import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import CharacterBroker from '../../brokers/CharacterBroker';
import ItemBroker from '../../brokers/ItemBroker';
import {jsonLogOutput} from '../../utils/json';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import Character from '../../data/Character';

@Injectable()
export default class VehicleDestroyEventHandler implements PS2EventQueueMessageHandlerInterface<VehicleDestroy> {
    public readonly eventName = 'VehicleDestroy';
    private static readonly logger = new Logger('VehicleDestroyEvent');

    constructor(
        private readonly characterBroker: CharacterBroker,
        private readonly itemBroker: ItemBroker,
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        @Inject(TYPES.vehicleDestroyAggregates) private readonly aggregateHandlers: Array<AggregateHandlerInterface<VehicleDestroyEvent>>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: PS2EventQueueMessage<VehicleDestroy>): Promise<boolean> {
        const characters: {character: Character, attacker: Character} = await this.characterBroker.get(event.payload);

        if (!characters.character) {
            VehicleDestroyEventHandler.logger.warn(`Unclaimed vehicle detected! Serving fake character!: \r\n${jsonLogOutput(event.payload)}`);
        }

        const vehicleDestroyEvent = new VehicleDestroyEvent(
            event,
            characters.character,
            characters.attacker,
        );

        VehicleDestroyEventHandler.logger.verbose('=== Processing VehicleDestroy Handlers ===');

        this.aggregateHandlers.map(
            (handler: AggregateHandlerInterface<VehicleDestroyEvent>) => void handler.handle(vehicleDestroyEvent)
                .catch((err: Error) => {
                    VehicleDestroyEventHandler.logger.error(`Error parsing AggregateHandlers for VehicleDestroyEvent: ${err.message}\r\n${jsonLogOutput(event)}`);
                }),
        );

        VehicleDestroyEventHandler.logger.verbose('=== VehicleDestroy Handlers Processed! ===');

        return true;
    }
}
