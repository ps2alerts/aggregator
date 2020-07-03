import PlayerHandler from './handlers/PlayerHandler';

require ('reflect-metadata');

import { Container } from 'inversify';
import Kernel from './bootstrap/Kernel';
import config from './config';
import PlayerHandlerInterface from './interfaces/PlayerHandlerInterface';

// Initialize container
const app = new Container({ autoBindInjectable: true, skipBaseClassChecks: true});

// Bind container to app const
app.bind<Container>(Container).toConstantValue(app);
// Bind Kernel to the application
app.bind<Kernel>(Kernel).toSelf().inSingletonScope();

app.bind<PlayerHandlerInterface>('PlayerHandlerInterface').to(PlayerHandler).inSingletonScope();
// Load the modules required to run the app
app.load(...config.app.modules);

// Export the app for running.
export default app;
