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
import OutfitWarsTerritoryInstance from '../../instances/OutfitWarsTerritoryInstance';
import {AxiosInstance} from 'axios';
import {ps2AlertsApiEndpoints} from '../../ps2alerts-constants/ps2AlertsApiEndpoints';

@injectable()
export default class DeathEventHandler implements PS2EventQueueMessageHandlerInterface<Death> {
    public readonly eventName = 'Death';
    private static readonly logger = getLogger('DeathEventHandler');

    constructor(
        private readonly itemBroker: ItemBroker,
        private readonly characterBroker: CharacterBroker,
        private readonly characterPresenceHandler: CharacterPresenceHandler,
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

        if (deathEvent.instance instanceof OutfitWarsTerritoryInstance) {
            // If exactly one team is defined in an outfit war,
            // both of the characters have outfits,
            // and one of the characters is in a different team,
            // set the missing team to that character's outfit
            if (deathEvent.instance.outfitwars.teams
                && (!!deathEvent.instance.outfitwars.teams.blue !== !!deathEvent.instance.outfitwars.teams.red)
                && deathEvent.attackerCharacter.outfit && deathEvent.character.outfit
                && deathEvent.attackerCharacter.outfit.id !== deathEvent.character.outfit.id
            ) {
                const teams = deathEvent.instance.outfitwars.teams;

                if (teams.blue) {
                    teams.red = (teams.blue.id === deathEvent.attackerCharacter.outfit.id)
                        ? deathEvent.character.outfit
                        : deathEvent.attackerCharacter.outfit;
                } else if (teams.red) {
                    teams.blue = (teams.red.id === deathEvent.attackerCharacter.outfit.id)
                        ? deathEvent.character.outfit
                        : deathEvent.attackerCharacter.outfit;
                } else {
                    DeathEventHandler.logger.warn('Neither team defined when updating teams from DeathEvent?');
                }

                await this.ps2AlertsApiClient.patch(
                    ps2AlertsApiEndpoints.outfitwarsInstance.replace('{instanceId}', deathEvent.instance.instanceId), {
                        outfitwars: {
                            teams,
                        },
                    });
            }
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
