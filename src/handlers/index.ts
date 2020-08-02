import {ContainerModule} from 'inversify';
import PlayerHandlerInterface from '../interfaces/PlayerHandlerInterface';
import PlayerHandler from './PlayerHandler';
import {TYPES} from '../constants/types';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';
import InstanceHandler from './InstanceHandler';
import EventHandlerInterface from '../interfaces/EventHandlerInterface';
import DeathEvent from './census/events/DeathEvent';
import DeathEventHandler from './census/DeathEventHandler';
import InstancePopulationData from '../data/InstancePopulationData';
import PopulationHandler from './PopulationHandler';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';

export default new ContainerModule((bind) => {
    bind<PlayerHandlerInterface>(TYPES.playerHandlerInterface).to(PlayerHandler).inSingletonScope();
    bind<InstanceHandlerInterface>(TYPES.instanceHandlerInterface).to(InstanceHandler).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathEventHandler).to(DeathEventHandler).inSingletonScope();
    bind<PopulationHandlerInterface<InstancePopulationData>>(TYPES.populationHandlerInterface).to(PopulationHandler).inSingletonScope();
});
