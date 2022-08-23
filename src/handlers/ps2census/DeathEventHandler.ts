import {inject, injectable, multiInject} from 'inversify';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandler from '../CharacterPresenceHandler';
import {Death} from 'ps2census';
import Parser from '../../utils/parser';
import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import CharacterBroker from '../../brokers/CharacterBroker';
import ItemBroker from '../../brokers/ItemBroker';
import ExceptionHandler from '../system/ExceptionHandler';
import {AxiosInstance} from 'axios';
import {Ps2alertsEventType} from '../../ps2alerts-constants/ps2alertsEventType';
import InstanceActionFactory from '../../factories/InstanceActionFactory';

@injectable()
export default class DeathEventHandler implements PS2EventQueueMessageHandlerInterface<Death> {
    public readonly eventName = 'Death';
    private static readonly logger = getLogger('DeathEventHandler');

    constructor(
        private readonly itemBroker: ItemBroker,
        private readonly characterBroker: CharacterBroker,
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        private readonly instanceActionFactory: InstanceActionFactory,
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        @multiInject(TYPES.deathAggregates) private readonly aggregateHandlers: Array<AggregateHandlerInterface<DeathEvent>>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: PS2EventQueueMessage<Death>): Promise<boolean> {
        // This should always return instances as it's filtered at the Ps2CensusMessageHandler level.
        const characters = await this.characterBroker.get(event.payload);

        const deathEvent = new DeathEvent(
            event,
            characters.attacker,
            characters.character,
            await this.itemBroker.get(
                Parser.parseNumericalArgument(event.payload.attacker_weapon_id),
                Parser.parseNumericalArgument(event.payload.attacker_vehicle_id),
            ),
        );

        if (deathEvent.instance.ps2alertsEventType === Ps2alertsEventType.OUTFIT_WARS_AUG_2022) {
            await this.instanceActionFactory.buildOutfitwarsDeath(deathEvent).execute().catch((e) => {
                if (e instanceof Error) {
                    DeathEventHandler.logger.error(`Error parsing Outfit Wars Instance Action "deathEvent" for DeathEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                } else {
                    DeathEventHandler.logger.error('UNEXPECTED ERROR running Instance Action "deathEvent"!');
                }
            });
        }

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
