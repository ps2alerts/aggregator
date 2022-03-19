import {TYPES} from '../constants/types';
import {CensusClient} from 'ps2census';
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
import {FacilityDataBrokerInterface} from '../interfaces/FacilityDataBrokerInterface';
import {inject, injectable} from 'inversify';

@injectable()
export default class CensusEventSubscriberFactory {
    constructor(
        private readonly deathEventHandler: DeathEventHandler,
        private readonly metagameEventEventHandler: MetagameEventEventHandler,
        private readonly facilityControlEventHandler: FacilityControlEventHandler,
        private readonly gainExperienceEventHandler: GainExperienceEventHandler,
        private readonly vehicleDestroyEventHandler: VehicleDestroyEventHandler,
        private readonly instanceAuthority: InstanceAuthority,
        @inject(TYPES.characterPresenceHandler) private readonly characterPresenceHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.itemBroker) private readonly itemBroker: ItemBrokerInterface,
        @inject(TYPES.facilityDataBroker) private readonly facilityDataBroker: FacilityDataBrokerInterface,
    ) {}

    public build(
        wsClient: CensusClient,
        environment: CensusEnvironment,
        characterBroker: CharacterBrokerInterface,
    ): CensusEventSubscriber {
        return new CensusEventSubscriber(
            wsClient,
            characterBroker,
            this.deathEventHandler,
            this.metagameEventEventHandler,
            this.facilityControlEventHandler,
            this.gainExperienceEventHandler,
            this.vehicleDestroyEventHandler,
            this.instanceAuthority,
            this.characterPresenceHandler,
            this.itemBroker,
            this.facilityDataBroker,
        );
    }
}
