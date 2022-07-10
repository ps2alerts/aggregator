import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import PopulationHandler from './PopulationHandler';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import PopulationData from '../data/PopulationData';
import OutfitParticipantCacheHandler from './OutfitParticipantCacheHandler';
import CharacterPresenceHandler from './CharacterPresenceHandler';

export default new ContainerModule((bind) => {
    bind(CharacterPresenceHandler).toSelf().inSingletonScope();
    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationHandler).to(PopulationHandler).inSingletonScope();
    bind(OutfitParticipantCacheHandler).toSelf().inSingletonScope();
});
