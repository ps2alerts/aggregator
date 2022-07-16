import {injectable, multiInject} from 'inversify';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandler from '../CharacterPresenceHandler';
import ApplicationException from '../../exceptions/ApplicationException';
import {Death} from 'ps2census';
import Parser from '../../utils/parser';
import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import {PS2EventInstanceHandlerContract} from '../../interfaces/PS2EventInstanceHandlerContract';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import CharacterBroker from '../../brokers/CharacterBroker';
import ItemBroker from '../../brokers/ItemBroker';
import ExceptionHandler from '../system/ExceptionHandler';

@injectable()
export default class DeathEventHandler implements PS2EventInstanceHandlerContract<Death> {
    public readonly eventName = 'Death';
    private static readonly logger = getLogger('DeathEventHandler');

    constructor(
        private readonly itemBroker: ItemBroker,
        private readonly characterBroker: CharacterBroker,
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        @multiInject(TYPES.deathAggregates) private readonly aggregateHandlers: Array<AggregateHandlerInterface<DeathEvent>>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: PS2EventQueueMessage<Death>): Promise<boolean> {
        // This should always return instances as it's filtered at the Ps2CensusMessageHandler level.
        const characters = await this.characterBroker.get(event.payload);

        if (!characters.character) {
            throw new ApplicationException('Character did not return!');
        }

        if (!characters.attacker) {
            throw new ApplicationException('Attacker character did not return!');
        }

        const deathEvent = new DeathEvent(
            event,
            characters.character,
            characters.attacker,
            await this.itemBroker.get(
                Parser.parseNumericalArgument(event.payload.attacker_weapon_id),
                Parser.parseNumericalArgument(event.payload.attacker_vehicle_id),
            ),
        );

        // Ensure the players are counted in the presence
        await Promise.all([
            this.characterPresenceHandler.update(deathEvent.character, deathEvent.instance),
            this.characterPresenceHandler.update(deathEvent.attackerCharacter, deathEvent.instance),
        ]);

        DeathEventHandler.logger.silly('=== Processing DeathEvent Handlers ===');

        this.aggregateHandlers.map(
            (handler: AggregateHandlerInterface<DeathEvent>) => void handler.handle(deathEvent)
                .catch((err) => {
                    if (err instanceof Error) {
                        new ExceptionHandler(`Error parsing AggregateHandlers for DeathEventHandler: ${err.message}\r\n${jsonLogOutput(event)}`, err, 'DeathEventHandler.aggregates');
                    } else {
                        DeathEventHandler.logger.error('UNEXPECTED ERROR parsing DeathEvent AggregateHandlers!');
                    }
                }),
        );

        DeathEventHandler.logger.silly('=== DeathEvent Handlers Processed! ===');

        return true;
    }
}
