import app from './bootstrap';
import Kernel from './bootstrap/Kernel';
import {promises as fsPromises} from 'fs';

// eslint-disable-next-line @typescript-eslint/no-use-before-define
void bootApp().then(async () => {
    console.info('Application fully booted! Writing ready file...');
    await fsPromises.writeFile('ready.file', 'ready');
});

async function bootApp(): Promise<void> {
    const kernel = await app.getAsync(Kernel);

    await kernel.run();

    process.on('unhandledRejection', (e) => {
        kernel.terminateWithUnhandledRejection(e);
    }).on('uncaughtException', (e) => {
        kernel.terminateWithError(e);
    }).on('exit', () => {
        void kernel.terminate();
    }).on('SIGTERM', () => {
        void kernel.terminate();
    }).on('SIGINT', () => {
        void kernel.terminate();
    });
}
