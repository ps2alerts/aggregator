import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import {Client, Death, Events, FacilityControl, GainExperience, MetagameEvent, VehicleDestroy} from 'ps2census';
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
import VehicleDestroyEvent from '../../handlers/census/events/VehicleDestroyEvent';
import VehicleDestroyEventHandler from '../../handlers/census/VehicleDestroyEventHandler';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';

@injectable()
export default class CensusEventSubscriberService implements ServiceInterface {
    public readonly bootPriority = 10;
    private static readonly logger = getLogger('EventListenerService');
    private readonly wsClient: Client;
    private readonly deathEventHandler: DeathEventHandler;
    private readonly metagameEventEventHandler: MetagameEventEventHandler;
    private readonly facilityControlEventHandler: FacilityControlEventHandler;
    private readonly gainExperienceEventHandler: GainExperienceEventHandler;
    private readonly vehicleDestroyEventHandler: VehicleDestroyEventHandler;
    private readonly instanceHandler: InstanceHandlerInterface;
    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;
    private readonly characterBroker: CharacterBrokerInterface;

    constructor(
        wsClient: Client,
        deathEventHandler: DeathEventHandler,
        metagameEventEventHandler: MetagameEventEventHandler,
        facilityControlEventHandler: FacilityControlEventHandler,
        gainExperienceEventHandler: GainExperienceEventHandler,
        vehicleDestroyEventHandler: VehicleDestroyEventHandler,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.characterBrokerInterface) characterBroker: CharacterBrokerInterface,
    ) {
        this.wsClient = wsClient;
        this.deathEventHandler = deathEventHandler;
        this.metagameEventEventHandler = metagameEventEventHandler;
        this.facilityControlEventHandler = facilityControlEventHandler;
        this.gainExperienceEventHandler = gainExperienceEventHandler;
        this.vehicleDestroyEventHandler = vehicleDestroyEventHandler;
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
        }
    }

    // Here we pass all the events
    private constructListeners(): void {

        // Set up event handlers
        this.wsClient.on(Events.PS2_DEATH, (censusEvent: Death) => {
            void this.processDeath(censusEvent);
        });

        this.wsClient.on(Events.PS2_CONTROL, (censusEvent: FacilityControl) => {
            void this.processFacilityControl(censusEvent);
        });

        this.wsClient.on(Events.PS2_EXPERIENCE, (censusEvent: GainExperience) => {
            void this.processGainExperience(censusEvent);
        });

        this.wsClient.on(Events.PS2_META_EVENT, (censusEvent: MetagameEvent) => {
            void this.processMetagameEvent(censusEvent);
        });

        this.wsClient.on(Events.PS2_VEHICLE_DESTROYED, (censusEvent) => {
            void this.processVehicleDestroy(censusEvent);
        });
    }

    private async processDeath(censusEvent: Death): Promise<void> {
        CensusEventSubscriberService.logger.silly('Processing Death Event');

        await Promise.all([
            this.characterBroker.get(censusEvent.attacker_character_id, parseInt(censusEvent.world_id, 10)),
            this.characterBroker.get(censusEvent.character_id, parseInt(censusEvent.world_id, 10)),
        ]).then(([attacker, character]) => {
            [attacker, character].forEach((char) => {
                void this.characterPresenceHandler.update(
                    char,
                    parseInt(censusEvent.zone_id, 10),
                );
            });

            this.getInstances(censusEvent).forEach((instance) => {
                void this.deathEventHandler.handle(
                    new DeathEvent(
                        censusEvent,
                        instance,
                        attacker,
                        character,
                    ),
                );
            });
        }).catch((e: Error) => {
            CensusEventSubscriberService.handleCharacterException('Death', e.message);
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    private async processFacilityControl(censusEvent: FacilityControl): Promise<void> {
        CensusEventSubscriberService.logger.silly('Processing FacilityControl censusEvent');

        this.getInstances(censusEvent).forEach((instance) => {
            setTimeout(() => {
                void this.facilityControlEventHandler.handle(
                    new FacilityControlEvent(
                        censusEvent,
                        instance,
                    ),
                );
            }, instance instanceof MetagameTerritoryInstance ? 2000 : 1);
        });
    }

    private async processGainExperience(censusEvent: GainExperience): Promise<void> {
        CensusEventSubscriberService.logger.silly('Processing GainExperience censusEvent');

        if (this.getInstances(censusEvent).length > 0) {
            await this.characterBroker.get(censusEvent.character_id, parseInt(censusEvent.world_id, 10))
                .then((character) => {
                    void this.characterPresenceHandler.update(
                        character,
                        parseInt(censusEvent.zone_id, 10),
                    );
                })
                .catch((e: Error) => {
                    CensusEventSubscriberService.handleCharacterException('GainExperience', e.message);
                });
        }
    }

    private async processMetagameEvent(censusEvent: MetagameEvent): Promise<void> {
        CensusEventSubscriberService.logger.debug('Processing MetagameEvent censusEvent');

        try {
            const metagameEvent = new MetagameEventEvent(censusEvent);
            await this.metagameEventEventHandler.handle(metagameEvent);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            CensusEventSubscriberService.logger.error(e.message);
        }
    }

    private async processVehicleDestroy(censusEvent: VehicleDestroy): Promise<void> {
        CensusEventSubscriberService.logger.silly('Processing VehicleDestroy censusEvent');

        await Promise.all([
            this.characterBroker.get(censusEvent.attacker_character_id, parseInt(censusEvent.world_id, 10)),
            this.characterBroker.get(censusEvent.character_id, parseInt(censusEvent.world_id, 10)),
        ]).then(([attacker, character]) => {
            [attacker, character].forEach((char) => {
                void this.characterPresenceHandler.update(
                    char,
                    parseInt(censusEvent.zone_id, 10),
                );
            });

            this.getInstances(censusEvent).forEach((instance) => {
                void this.vehicleDestroyEventHandler.handle(
                    new VehicleDestroyEvent(
                        censusEvent,
                        instance,
                        attacker,
                        character,
                    ),
                );
            });
        }).catch((e: Error) => {
            CensusEventSubscriberService.handleCharacterException('VehicleDestroy', e.message);
        });
    }

    private getInstances(censusEvent: Death | FacilityControl |GainExperience | VehicleDestroy): PS2AlertsInstanceInterface[] {
        return this.instanceHandler.getInstances(
            parseInt(censusEvent.world_id, 10),
            parseInt(censusEvent.zone_id, 10),
        );
    }
}
