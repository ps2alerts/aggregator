import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import PopulationHandler from './PopulationHandler';
import PopulationData from '../data/PopulationData';
import OutfitParticipantCacheHandler from './OutfitParticipantCacheHandler';
import CharacterPresenceHandler from './CharacterPresenceHandler';
import MessageQueueHandlerInterface from '../interfaces/MessageQueueHandlerInterface';

export default new ContainerModule((bind) => {
    bind(CharacterPresenceHandler).toSelf().inSingletonScope();
    bind<MessageQueueHandlerInterface<PopulationData>>(TYPES.populationHandler).to(PopulationHandler).inSingletonScope();
    bind(OutfitParticipantCacheHandler).toSelf().inSingletonScope();
});
