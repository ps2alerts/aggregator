import {ContainerModule} from 'inversify';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import CharacterPresenceHandler from './CharacterPresenceHandler';
import {TYPES} from '../constants/types';
import PopulationHandler from './PopulationHandler';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import PopulationData from '../data/PopulationData';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import CharacterBroker from './CharacterBroker';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import ItemBroker from './ItemBroker';
import OutfitParticipantCacheHandler from './OutfitParticipantCacheHandler';
import FacilityDataBroker from './FacilityDataBroker';

export default new ContainerModule((bind) => {
    bind<CharacterPresenceHandlerInterface>(TYPES.characterPresenceHandler).to(CharacterPresenceHandler).inSingletonScope();

    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationHandler).to(PopulationHandler).inSingletonScope();

    bind<CharacterBrokerInterface>(TYPES.characterBroker).to(CharacterBroker);

    bind<ItemBrokerInterface>(TYPES.itemBroker).to(ItemBroker).inSingletonScope();
    bind<FacilityDataBroker>(TYPES.facilityDataBroker).to(FacilityDataBroker).inSingletonScope();
    bind<OutfitParticipantCacheHandler>(TYPES.outfitParticipantCacheHandler).to(OutfitParticipantCacheHandler).inSingletonScope();
});
