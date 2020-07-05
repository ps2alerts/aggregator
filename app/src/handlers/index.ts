import { ContainerModule } from 'inversify';
import PlayerHandlerInterface from '../interfaces/PlayerHandlerInterface';
import PlayerHandler from './PlayerHandler';
import {TYPES} from '../utils/types';

export default new ContainerModule(bind => {
    bind<PlayerHandlerInterface>(TYPES.PlayerHandlerInterface).to(PlayerHandler).inSingletonScope();
});
