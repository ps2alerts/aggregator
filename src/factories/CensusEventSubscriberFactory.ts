import {Client} from 'ps2census';
import CensusEventSubscriber from '../services/census/CensusEventSubscriber';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import DeathEventHandler from '../handlers/census/DeathEventHandler';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import MetagameEventEventHandler from '../handlers/census/MetagameEventEventHandler';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import GainExperienceEventHandler from '../handlers/census/GainExperienceEventHandler';
import FacilityControlEventHandler from '../handlers/census/FacilityControlEventHandler';
import VehicleDestroyEventHandler from '../handlers/census/VehicleDestroyEventHandler';
import InstanceAuthority from '../authorities/InstanceAuthority';
import {CensusEnvironment} from '../types/CensusEnvironment';

export default class CensusEventSubscriberFactory {
    private readonly deathEventHandler: DeathEventHandler;
    private readonly metagameEventEventHandler: MetagameEventEventHandler;
    private readonly facilityControlEventHandler: FacilityControlEventHandler;
    private readonly gainExperienceEventHandler: GainExperienceEventHandler;
    private readonly vehicleDestroyEventHandler: VehicleDestroyEventHandler;
    private readonly instanceAuthority: InstanceAuthority;
    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;
    private readonly itemBroker: ItemBrokerInterface;

    constructor(
        deathEventHandler: DeathEventHandler,
        metagameEventEventHandler: MetagameEventEventHandler,
        facilityControlEventHandler: FacilityControlEventHandler,
        gainExperienceEventHandler: GainExperienceEventHandler,
        vehicleDestroyEventHandler: VehicleDestroyEventHandler,
        instanceAuthority: InstanceAuthority,
        characterPresenceHandler: CharacterPresenceHandlerInterface,
        itemBroker: ItemBrokerInterface,
    ) {
        this.deathEventHandler = deathEventHandler;
        this.metagameEventEventHandler = metagameEventEventHandler;
        this.facilityControlEventHandler = facilityControlEventHandler;
        this.gainExperienceEventHandler = gainExperienceEventHandler;
        this.vehicleDestroyEventHandler = vehicleDestroyEventHandler;
        this.instanceAuthority = instanceAuthority;
        this.characterPresenceHandler = characterPresenceHandler;
        this.itemBroker = itemBroker;
    }

    public build(
        wsClient: Client,
        environment: CensusEnvironment,
        characterBroker: CharacterBrokerInterface,
    ): CensusEventSubscriber {
        return new CensusEventSubscriber(
            wsClient,
            environment,
            characterBroker,
            this.deathEventHandler,
            this.metagameEventEventHandler,
            this.facilityControlEventHandler,
            this.gainExperienceEventHandler,
            this.vehicleDestroyEventHandler,
            this.instanceAuthority,
            this.characterPresenceHandler,
            this.itemBroker,
        );
    }
}