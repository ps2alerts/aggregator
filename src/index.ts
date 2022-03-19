import app from './bootstrap';
import Kernel from './bootstrap/Kernel';

process.on('uncaughtException', console.log);

const kernel = app.resolve(Kernel);

void kernel.run().then(() => {
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
});
