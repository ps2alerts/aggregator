import app from './bootstrap';
import Kernel from './kernel';
const kernel = app.get<Kernel>(Kernel);

console.log("Booting Kernel...");

kernel.run().then(() => {
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