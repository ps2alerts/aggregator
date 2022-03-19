import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import {CensusClient, Death, Events, FacilityControl, GainExperience, MetagameEvent, VehicleDestroy} from 'ps2census';
// Events
import DeathEvent from '../../handlers/census/events/DeathEvent';
import MetagameEventEvent from '../../handlers/census/events/MetagameEventEvent';
import FacilityControlEvent from '../../handlers/census/events/FacilityControlEvent';
import InstanceAuthority from '../../authorities/InstanceAuthority';
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
import {ItemBrokerInterface} from '../../interfaces/ItemBrokerInterface';
import Parser from '../../utils/parser';
import {CensusEnvironment} from '../../types/CensusEnvironment';
import {metagameEventTypeArray} from '../../constants/metagameEventType';
import {FacilityDataBrokerInterface} from '../../interfaces/FacilityDataBrokerInterface';
import ApplicationException from "../../exceptions/ApplicationException";

@injectable()
export default class CensusEventSubscriber implements ServiceInterface {
    public readonly bootPriority = 10;
    private static readonly logger = getLogger('CenusEventSubscriber');
    private eventsReady = false;

    constructor(
        private readonly wsClient: CensusClient,
        private readonly environment: CensusEnvironment,
        private readonly characterBroker: CharacterBrokerInterface,
        private readonly deathEventHandler: DeathEventHandler,
        private readonly metagameEventEventHandler: MetagameEventEventHandler,
        private readonly facilityControlEventHandler: FacilityControlEventHandler,
        private readonly gainExperienceEventHandler: GainExperienceEventHandler,
        private readonly vehicleDestroyEventHandler: VehicleDestroyEventHandler,
        private readonly instanceAuthority: InstanceAuthority,
        private readonly characterPresenceHandler: CharacterPresenceHandlerInterface,
        private readonly itemBroker: ItemBrokerInterface,
        private readonly facilityDataBroker: FacilityDataBrokerInterface,
    ) {}

    // Here we pass all the events
    public constructListeners(): void {
        if (this.eventsReady) {
            CensusEventSubscriber.logger.warn(`[${this.environment}] Attempted to set up event handlers more than once!`);
            return;
        }

        this.wsClient.on(Events.PS2_SERVICE_STATE, (server, status) => {
            if (!status) {
                CensusEventSubscriber.logger.error(`[${this.environment}] Server Instability! ${server} reported as down!`);
            }
        });

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

        CensusEventSubscriber.logger.info(`[${this.environment}] Events subscribed!`);
        this.eventsReady = true;
    }

    private static handleCharacterException(service: string, message: string, environment: CensusEnvironment): void {
        if (
            message.includes('No data found') ||
            message.includes('api returned no matches for')
        ) {
            CensusEventSubscriber.logger.warn(`[${environment}] Unable to process ${service} event after 3 tries! W: ${message}`);
        }
    }

    private async processDeath(censusEvent: Death): Promise<void> {
        CensusEventSubscriber.logger.silly(`[${this.environment}] Processing Death Event`);

        await Promise.all([
            this.characterBroker.get(censusEvent.attacker_character_id, parseInt(censusEvent.world_id, 10)),
            this.characterBroker.get(censusEvent.character_id, parseInt(censusEvent.world_id, 10)),
        ]).then(async ([attacker, character]) => {
            if (!attacker || !character) {
                throw new ApplicationException('A Character did not return! Cannot complete processDeath!', 'CensusEventSubscriber:processDeath')
            }
            CensusEventSubscriber.logger.silly(`[${this.environment}] Death: Successfully found all characters`);

            // Update the presence handler so we can have a running population count, even without any instances.
            [attacker, character].forEach((char) => {
                void this.characterPresenceHandler.update(
                    char,
                    parseInt(censusEvent.zone_id, 10),
                );
            });

            const instances = this.getInstances(censusEvent);

            // If not related to any instances, don't process any further
            if (instances.length === 0) {
                CensusEventSubscriber.logger.silly(`[${this.environment}] No instances found!`);
                return;
            }

            const item = await this.itemBroker.get(
                this.environment,
                Parser.parseNumericalArgument(censusEvent.attacker_weapon_id),
                Parser.parseNumericalArgument(censusEvent.attacker_vehicle_id),
            );

            for (const instance of instances) {
                CensusEventSubscriber.logger.silly(`[${this.environment}] Death: Processing instance ${instance.instanceId}`);
                await this.deathEventHandler.handle(
                    new DeathEvent(
                        censusEvent,
                        instance,
                        attacker,
                        character,
                        item,
                    ),
                    this.environment,
                );
            }
        }).catch((e: Error) => {
            CensusEventSubscriber.handleCharacterException('Death', e.message, this.environment);
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    private async processFacilityControl(censusEvent: FacilityControl): Promise<void> {
        CensusEventSubscriber.logger.silly(`[${this.environment}] Processing FacilityControl censusEvent`);

        for (const instance of this.getInstances(censusEvent)) {
            const facility = await this.facilityDataBroker.get(
                this.environment,
                Parser.parseNumericalArgument(censusEvent.facility_id),
                Parser.parseNumericalArgument(censusEvent.zone_id),
            );

            setTimeout(() => {
                void this.facilityControlEventHandler.handle(
                    new FacilityControlEvent(
                        censusEvent,
                        instance,
                        facility,
                    ),
                    this.environment,
                );
            }, instance instanceof MetagameTerritoryInstance ? 2000 : 1);
        }
    }

    private async processGainExperience(censusEvent: GainExperience): Promise<void> {
        CensusEventSubscriber.logger.silly(`[${this.environment}] Processing GainExperience censusEvent`);

        await this.characterBroker.get(censusEvent.character_id, parseInt(censusEvent.world_id, 10))
            .then((character) => {
                if (!character) {
                    throw new ApplicationException('A Character did not return! Cannot complete processVehicleDestroy!', 'CensusEventSubscriber:processGainExperience')
                }
                // Update the character presence handler so we can ensure populations are correct at all times
                void this.characterPresenceHandler.update(
                    character,
                    parseInt(censusEvent.zone_id, 10),
                );
            })
            .catch((e: Error) => {
                CensusEventSubscriber.handleCharacterException('GainExperience', e.message, this.environment);
            });
    }

    private async processMetagameEvent(censusEvent: MetagameEvent): Promise<void> {
        CensusEventSubscriber.logger.debug(`[${this.environment}] Processing MetagameEvent censusEvent`);

        if (metagameEventTypeArray.includes(parseInt(censusEvent.metagame_event_id, 10))) {
            try {
                const metagameEvent = new MetagameEventEvent(censusEvent);
                await this.metagameEventEventHandler.handle(metagameEvent, this.environment);
            } catch (err) {
                if (err instanceof Error) {
                    CensusEventSubscriber.logger.error(err.message);
                }
            }
        } else {
            CensusEventSubscriber.logger.warn(`Unknown / unsupported metagame_event_id: ${censusEvent.metagame_event_id}`);
        }
    }

    private async processVehicleDestroy(censusEvent: VehicleDestroy): Promise<void> {
        CensusEventSubscriber.logger.silly(`[${this.environment}] Processing VehicleDestroy censusEvent`);

        await Promise.all([
            this.characterBroker.get(censusEvent.attacker_character_id, parseInt(censusEvent.world_id, 10)),
            this.characterBroker.get(censusEvent.character_id, parseInt(censusEvent.world_id, 10)),
        ]).then(([attacker, character]) => {
            if (!attacker || !character) {
                throw new ApplicationException('A Character did not return! Cannot complete processVehicleDestroy!', 'CensusEventSubscriber:processVehicleDestroy')
            }
            // Update the character presence handler so we can ensure populations are correct at all times
            [attacker, character].forEach((char) => {
                void this.characterPresenceHandler.update(
                    char,
                    parseInt(censusEvent.zone_id, 10),
                );
            });

            // If there are no instances, this will not continue to process.
            this.getInstances(censusEvent).forEach((instance) => {
                void this.vehicleDestroyEventHandler.handle(
                    new VehicleDestroyEvent(
                        censusEvent,
                        instance,
                        attacker,
                        character,
                    ),
                    this.environment,
                );
            });
        }).catch((e: Error) => {
            CensusEventSubscriber.handleCharacterException('VehicleDestroy', e.message, this.environment);
        });
    }

    private getInstances(censusEvent: Death | FacilityControl |GainExperience | VehicleDestroy): PS2AlertsInstanceInterface[] {
        return this.instanceAuthority.getInstances(
            parseInt(censusEvent.world_id, 10),
            parseInt(censusEvent.zone_id, 10),
        );
    }
}
