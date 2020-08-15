import {ContainerModule} from 'inversify';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import CharacterPresenceHandler from './CharacterPresenceHandler';
import {TYPES} from '../constants/types';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';
import InstanceHandler from './InstanceHandler';
import EventHandlerInterface from '../interfaces/EventHandlerInterface';
import DeathEvent from './census/events/DeathEvent';
import DeathEventHandler from './census/DeathEventHandler';
import PopulationHandler from './PopulationHandler';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import PopulationData from '../data/PopulationData';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import CharacterBroker from './CharacterBroker';

export default new ContainerModule((bind) => {
    bind<CharacterPresenceHandlerInterface>(TYPES.characterPresenceHandlerInterface).to(CharacterPresenceHandler).inSingletonScope();
    bind<InstanceHandlerInterface>(TYPES.instanceHandlerInterface).to(InstanceHandler).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathEventHandler).to(DeathEventHandler).inSingletonScope();
    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationHandlerInterface).to(PopulationHandler).inSingletonScope();
    bind<CharacterBrokerInterface>(TYPES.characterBrokerInterface).to(CharacterBroker).inSingletonScope();
});
