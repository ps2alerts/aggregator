import app from './bootstrap';
import Kernel from './bootstrap/Kernel';

const kernel = app.resolve(Kernel);

void kernel.run().then(() => {
    process.on('unhandledRejection', (e) => {
        kernel.terminateWithError(e);
    }).on('uncaughtException', (e) => {
        kernel.terminateWithError(e);
    }).on('exit', () => {
        kernel.terminate();
    }).on('SIGTERM', () => {
        kernel.terminate();
    }).on('SIGINT', () => {
        kernel.terminate();
    });
});
