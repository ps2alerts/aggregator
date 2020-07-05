import { ContainerModule } from 'inversify';
import PlayerHandlerInterface from '../interfaces/PlayerHandlerInterface';
import PlayerHandler from './PlayerHandler';
import { TYPES } from '../constants/types';
import AlertHandlerInterface from '../interfaces/AlertHandlerInterface';
import AlertHandler from './AlertHandler';

export default new ContainerModule(bind => {
    bind<PlayerHandlerInterface>(TYPES.PlayerHandlerInterface).to(PlayerHandler).inSingletonScope();
    bind<AlertHandlerInterface>(TYPES.AlertHandlerInterface).to(AlertHandler).inSingletonScope();
});
