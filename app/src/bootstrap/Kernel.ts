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

    private readonly container: Container;

    private readonly services: ServiceInterface[];

    /**
     * @type {RunningStates} Running state of the kernel
     */
    private state: RunningStates = RunningStates.IDLE;

    /**
     * Constructor.
     * @param {Container} container the IoC Container
     * @param {ServiceInterface } services
     */
    constructor(
        container: Container,
        @multiInject(SERVICE) services: ServiceInterface[],
    ) {
        this.container = container;
        this.services = services;
    }

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
            Kernel.logger.info('==== Booting services ====');
            await Promise.all(
                this.services.map(
                    (service) => service.boot?.apply(service, [this.container]),
                ),
            );

            Kernel.logger.info('==== Services booted! ====');

            Kernel.logger.info('==== Starting services ====');
            await Promise.all(
                this.services.map(
                    (service) => service.start?.apply(
                        service, [this.container]),
                ),
            );

            Kernel.logger.info('==== Services started! ====');

            this.state = RunningStates.RUNNING;
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            const name: string = e.name;

            switch (name) {
                case 'ApplicationException':
                case 'InvalidArgumentException':
                    this.handleApplicationException(e);
                    break;

                default: {
                    this.terminate(1);
                }
            }
        }
    }

    /**
     * Public interface to execute a termination. An ApplicationException object must be supplied, giving the correct data.
     * @param code number
     */
    public terminate(code = 0): never {
        // Set app as terminating!
        this.state = RunningStates.TERMINATING;

        Kernel.logger.info(`TERMINATING! CODE: ${code}`);

        // Handle killing everything here
        process.exit(code);
    }

    public terminateWithUnhandledRejection(error: unknown): void {
        Kernel.logger.error('unhandledRejection detected!');
        Kernel.logger.error(error);
    }

    /**
     * Executes logging and termination of the application.
     * @param err any
     * @param code number
     */
    public terminateWithError(err: Error, code = 1): void {
        Kernel.logger.error(err.stack ?? err.message);

        this.terminate(code);
    }

    /**
     * Application level errors will be catched here, echoed out and displayed correctly
     * @param exception ApplicationException
     */
    private handleApplicationException(exception: ApplicationException): void {
        Kernel.logger.error(`MESSAGE: ${exception.message}`);
        Kernel.logger.error(`ORIGIN: ${exception.origin ?? 'null'}`);
        Kernel.logger.error(`CODE: ${exception.code ?? 'null'}`);

        this.terminate(exception.code ?? 1);
    }
}
