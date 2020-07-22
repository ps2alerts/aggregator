import {ContainerModule} from 'inversify';
import PlayerHandlerInterface from '../interfaces/PlayerHandlerInterface';
import PlayerHandler from './PlayerHandler';
import {TYPES} from '../constants/types';
import AlertHandlerInterface from '../interfaces/AlertHandlerInterface';
import AlertHandler from './AlertHandler';
import EventHandlerInterface from '../interfaces/EventHandlerInterface';
import DeathEvent from './census/events/DeathEvent';
import DeathEventHandler from './census/DeathEventHandler';

export default new ContainerModule((bind) => {
    bind<PlayerHandlerInterface>(TYPES.playerHandlerInterface).to(PlayerHandler).inSingletonScope();
    bind<AlertHandlerInterface>(TYPES.alertHandlerInterface).to(AlertHandler).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathEventHandler).to(DeathEventHandler).inSingletonScope();
});
