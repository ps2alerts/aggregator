import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client, Death, GainExperience} from 'ps2census';
import {TYPES} from '../../constants/types';
// Events
import DeathEvent from '../../handlers/census/events/DeathEvent';
import MetagameEventEvent from '../../handlers/census/events/MetagameEventEvent';
import FacilityControlEvent from '../../handlers/census/events/FacilityControlEvent';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
// Handlers
import DeathEventHandler from '../../handlers/census/DeathEventHandler';
import MetagameEventEventHandler from '../../handlers/census/MetagameEventEventHandler';
import FacilityControlEventHandler from '../../handlers/census/FacilityControlEventHandler';
import GainExperienceEventHandler from '../../handlers/census/GainExperienceEventHandler';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
// Other
import {CharacterBrokerInterface} from '../../interfaces/CharacterBrokerInterface';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';

@injectable()
export default class CensusEventSubscriberService implements ServiceInterface {
    public readonly bootPriority = 10;
    private static readonly logger = getLogger('EventListenerService');
    private readonly wsClient: Client;
    private readonly deathEventHandler: DeathEventHandler;
    private readonly metagameEventEventHandler: MetagameEventEventHandler;
    private readonly facilityControlEventHandler: FacilityControlEventHandler;
    private readonly gainExperienceEventHandler: GainExperienceEventHandler;
    private readonly instanceHandler: InstanceHandlerInterface;
    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;
    private readonly characterBroker: CharacterBrokerInterface;

    constructor(
        wsClient: Client,
        deathEventHandler: DeathEventHandler,
        metagameEventEventHandler: MetagameEventEventHandler,
        facilityControlEventHandler: FacilityControlEventHandler,
        gainExperienceEventHandler: GainExperienceEventHandler,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.characterBrokerInterface) characterBroker: CharacterBrokerInterface,
    ) {
        this.wsClient = wsClient;
        this.deathEventHandler = deathEventHandler;
        this.metagameEventEventHandler = metagameEventEventHandler;
        this.facilityControlEventHandler = facilityControlEventHandler;
        this.gainExperienceEventHandler = gainExperienceEventHandler;
        this.instanceHandler = instanceHandler;
        this.characterPresenceHandler = characterPresenceHandler;
        this.characterBroker = characterBroker;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusEventSubscriberService.logger.debug('Booting EventListenerService...');

        this.constructListeners();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        CensusEventSubscriberService.logger.debug('Starting EventListenerService... (NOT IMPLEMENTED)');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        CensusEventSubscriberService.logger.debug('Terminating Census Stream Service!');
    }

    private static handleCharacterException(service: string, message: string): void {
        if (
            message.includes('No data found') ||
            message.includes('api returned no matches for')
        ) {
            CensusEventSubscriberService.logger.warn(`Unable to process ${service} event after 3 tries! W: ${message}`);
        } else {
            CensusEventSubscriberService.logger.error(`Unable to process ${service} event after 3 tries! E: ${message}`);
        }
    }

    // Here we pass all the events
    private constructListeners(): void {

        // Set up event handlers
        this.wsClient.on('death', (event: Death) => {
            CensusEventSubscriberService.logger.silly('Passing Death to listener');

            void this.processDeath(event, 0);
        });

        this.wsClient.on('facilityControl', (event) => {
            const instances = this.instanceHandler.getInstances(
                parseInt(event.world_id, 10),
                parseInt(event.zone_id, 10),
            );

            instances.forEach((instance) => {
                let delay = 1;

                if (instance instanceof MetagameTerritoryInstance) {
                    delay = 2000;
                }

                setTimeout(() => {
                    CensusEventSubscriberService.logger.silly('Passing FacilityControl to listener');
                    const facilityControl = new FacilityControlEvent(
                        event,
                        instance,
                    );
                    void this.facilityControlEventHandler.handle(facilityControl);
                }, delay);
            });
        });

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.wsClient.on('gainExperience', (event) => {
            void this.processGainExperience(event, 0);
        });

        this.wsClient.on('metagameEvent', (event) => {
            CensusEventSubscriberService.logger.debug('Passing MetagameEvent to listener');

            try {
                const metagameEvent = new MetagameEventEvent(event);
                void this.metagameEventEventHandler.handle(metagameEvent);
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                CensusEventSubscriberService.logger.error(e.message);
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    private async processDeath(event: Death, tries = 0): Promise<void> {
        const retryLimit = 3;
        tries++;

        void Promise.all([
            this.characterBroker.get(event.attacker_character_id, parseInt(event.world_id, 10)),
            this.characterBroker.get(event.character_id, parseInt(event.world_id, 10)),
        ]).then(([attacker, character]) => {
            [attacker, character].forEach((char) => {
                void this.characterPresenceHandler.update(
                    char,
                    parseInt(event.zone_id, 10),
                );
            });

            const instances = this.instanceHandler.getInstances(
                parseInt(event.world_id, 10),
                parseInt(event.zone_id, 10),
            );

            instances.forEach((instance) => {
                const deathEvent = new DeathEvent(
                    event,
                    instance,
                    attacker,
                    character,
                );

                if (tries > 1) {
                    CensusEventSubscriberService.logger.debug(`Retry #${tries} successful for Death event for character ${event.character_id}`);
                }

                void this.deathEventHandler.handle(deathEvent);
            });
        }).catch((e) => {
            if (tries >= retryLimit) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                CensusEventSubscriberService.handleCharacterException('Death', e.message);
            } else {
                // Retry
                CensusEventSubscriberService.logger.debug(`Retrying Death event #${tries} - ${event.character_id}`);
                void this.processDeath(event, tries);
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    private async processGainExperience(event: GainExperience, tries = 0): Promise<void> {
        const retryLimit = 3;
        tries++;

        await this.characterBroker.get(event.character_id, parseInt(event.world_id, 10))
            .then((character) => {
                if (tries > 1) {
                    CensusEventSubscriberService.logger.debug(`Retry #${tries} successful for GainExperience event for character ${event.character_id}`);
                }

                void this.characterPresenceHandler.update(
                    character,
                    parseInt(event.zone_id, 10),
                );
            })
            .catch((e) => {
                if (tries >= retryLimit) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    CensusEventSubscriberService.handleCharacterException('GainExperience', e.message);
                } else {
                    CensusEventSubscriberService.logger.debug(`Retrying GainExperience event #${tries} - ${event.character_id}`);
                    void this.processGainExperience(event, tries);
                }
            });
    }
}
