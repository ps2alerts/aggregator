import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import PopulationHandler from './PopulationHandler';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import PopulationData from '../data/PopulationData';
import CharacterBroker from './CharacterBroker';
import ItemBroker from './ItemBroker';
import OutfitParticipantCacheHandler from './OutfitParticipantCacheHandler';
import FacilityDataBroker from './FacilityDataBroker';
import CharacterPresenceHandler from './CharacterPresenceHandler';

export default new ContainerModule((bind) => {
    bind(CharacterPresenceHandler).toSelf().inSingletonScope();

    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationHandler).to(PopulationHandler).inSingletonScope();

    bind(CharacterBroker).toSelf().inSingletonScope();

    bind(ItemBroker).toSelf().inSingletonScope();
    bind(FacilityDataBroker).toSelf().inSingletonScope();
    bind(OutfitParticipantCacheHandler).toSelf().inSingletonScope();
});
