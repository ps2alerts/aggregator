import app from './lib/bootstrap';
import Kernel from './lib/kernel';
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