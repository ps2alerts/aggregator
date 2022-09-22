/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {Inject, Injectable, Logger} from '@nestjs/common';
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
import {Ps2AlertsEventType} from '../../ps2alerts-constants/ps2AlertsEventType';
import InstanceActionFactory from '../../factories/InstanceActionFactory';

@Injectable()
export default class DeathEventHandler implements PS2EventQueueMessageHandlerInterface<Death> {
    public readonly eventName = 'Death';
    private static readonly logger = new Logger('DeathEventHandler');

    constructor(
        private readonly itemBroker: ItemBroker,
        private readonly characterBroker: CharacterBroker,
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        private readonly instanceActionFactory: InstanceActionFactory,
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        @Inject(TYPES.deathAggregates) private readonly aggregateHandlers: Array<AggregateHandlerInterface<DeathEvent>>,
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

        if (deathEvent.instance.ps2AlertsEventType === Ps2AlertsEventType.OUTFIT_WARS_AUG_2022) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
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

        DeathEventHandler.logger.debug('=== Processing DeathEvent Handlers ===');

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

        DeathEventHandler.logger.debug('=== DeathEvent Handlers Processed! ===');

        return true;
    }
}
