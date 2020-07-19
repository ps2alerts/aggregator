// @See https://github.com/microwavekonijn/ps2census for further commands (wsClient)

import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import CensusProxy from '../../handlers/census/CensusProxy';
import {Client} from 'ps2census';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    private static readonly logger = getLogger('ps2census');

    private readonly wsClient: Client;
    private readonly censusProxy: CensusProxy;
    private readonly subscriptions = [];

    constructor(wsClient: Client, censusProxy: CensusProxy) {
        this.wsClient = wsClient;
        this.censusProxy = censusProxy;

        this.prepareClient();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusStreamService.logger.info('Booting Census Stream Service...');
    }

    public async start(): Promise<void> {
        CensusStreamService.logger.info('Starting Census Stream Service...');
        await this.wsClient.watch();
    }

    public terminate(): void {
        CensusStreamService.logger.info('Terminating Census Stream Service!');

        try {
            this.wsClient.destroy();
        } catch {
            // Fucked
        }
    }

    private prepareClient(): void {
        this.wsClient.on('ready', () => {
            CensusStreamService.logger.info('Census Stream Service connected!');
        });

        // Set up event handlers
        this.wsClient.on('ps2Event', (event) => {
            this.censusProxy.handle(event);
        });

        this.wsClient.on('reconnecting', () => {
            CensusStreamService.logger.warn('Census stream connection lost... reconnecting...');
        });

        this.wsClient.on('disconnected', () => {
            CensusStreamService.logger.error('Census stream connection disconnected!');
        });

        this.wsClient.on('error', (error: Error) => {
            CensusStreamService.logger.error(`Census stream error! ${error.message}`);
        });

        this.wsClient.on('warn', (error: Error) => {
            CensusStreamService.logger.warn(`Census stream warn! ${error.message}`);
        });
    }
}
