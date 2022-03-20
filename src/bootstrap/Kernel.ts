import {groupBy} from 'lodash';
import {Container, injectable, multiInject} from 'inversify';
import {getLogger} from '../logger';
import KernelInterface from '../interfaces/KernelInterface';
import ServiceInterface, {SERVICE} from '../interfaces/ServiceInterface';
import config from '../config';
import ApplicationException from '../exceptions/ApplicationException';

/**
 * Denotes the running states of the application.
 */
enum RunningStates {
    IDLE,
    BOOTING,
    RUNNING,
    TERMINATING,
}

/**
 * The Kernel acts as the starting point of the application, loading services required in order for it to run, bit like an OS.
 */
@injectable()
export default class Kernel implements KernelInterface {
    private static readonly logger = getLogger('kernel');

    /**
     * @type {RunningStates} Running state of the kernel
     */
    private state: RunningStates = RunningStates.IDLE;

    /**
     * Constructor.
     * @param {Container} container the IoC Container
     * @param {ServiceInterface[]} services services to boot
     */
    constructor(
        private readonly container: Container,
        @multiInject(SERVICE) private readonly services: ServiceInterface[],
    ) {}

    /**
     * Execute order 66 (run the app).
     */
    public async run(): Promise<void> {
        // If already booting, stop here.
        if (this.state !== RunningStates.IDLE) {
            return;
        }

        this.state = RunningStates.BOOTING;

        Kernel.logger.info(`Starting! == VERSION: ${config.app.version}, ENV: ${config.app.environment} ==`);

        try {
            // @See config/app/.ts
            Kernel.logger.debug('==== Booting services ====');

            const bootGroups = groupBy(this.services, 'bootPriority');

            // Perfectly fine, even though Object.keys return an array of strings. Magic :D
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            for (const bootKey of (Object.keys(bootGroups) as number[]).sort((x, y) => (x - y))) {
                await Promise.all(
                    bootGroups[bootKey].map(
                        (service) => service.boot?.apply(service, [this.container]),
                    ),
                );
            }

            Kernel.logger.info('==== Services booted! ====');

            Kernel.logger.debug('==== Starting services ====');
            await Promise.all(
                this.services.map(
                    (service) => service.start?.apply(
                        service, [this.container]),
                ),
            );

            Kernel.logger.info('==== Services started! ====');

            this.state = RunningStates.RUNNING;
        } catch (err) {
            if (err instanceof ApplicationException) {
                this.handleApplicationException(err);
            }

            if (err instanceof Error) {
                Kernel.logger.error(`====== UNKNOWN ERROR HAS OCCURRED! "${err.name}" MESSAGE AS FOLLOWS:`);
                Kernel.logger.error(err.message);
            }

            // Fucked
            if (!(err instanceof Error)) {
                Kernel.logger.error(`====== KERNEL DIED, NO ERROR OBJECT GIVEN! =======`);
            }

            await this.terminate(1);
        }
    }

    /**
     * Public interface to execute a termination. An ApplicationException object must be supplied, giving the correct data.
     * @param code number
     */
    public async terminate(code = 0): Promise<void> {
        if (this.state === RunningStates.TERMINATING) {
            return; // Only run the terminate once
        }

        // Set app as terminating!
        this.state = RunningStates.TERMINATING;

        Kernel.logger.error(`TERMINATING! CODE: ${code}`);

        // Give the services a chance to terminate safely
        await Promise.all(
            this.services.map(
                (service) => service.terminate?.apply(this.services)
                    .catch((err: Error) => {
                        Kernel.logger.error(`Caught an error while terminating "${service.constructor.name}": ${err.stack ?? err.message}`);
                    }),
            ),
        );

        process.exit(code);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public terminateWithUnhandledRejection(error: any): void {
        Kernel.logger.error('unhandledRejection detected!');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        Kernel.logger.error(error.stack ?? error);

        void this.terminate(1);
    }

    /**
     * Executes logging and termination of the application.
     * @param err any
     * @param code number
     */
    public terminateWithError(err: Error, code = 1): void {
        Kernel.logger.error(err.stack ?? err.message);

        void this.terminate(code);
    }

    /**
     * Application level errors will be caught here, echoed out and displayed correctly
     * @param exception ApplicationException|Error
     */
    private handleApplicationException(exception: ApplicationException): void {
        Kernel.logger.error(`MESSAGE: ${exception.message}`);
        Kernel.logger.error(`ORIGIN: ${exception.origin ?? 'null'}`);
        Kernel.logger.error(`CODE: ${exception.code ?? 'null'}`);

        void this.terminate(exception.code ?? 1);
    }
}
