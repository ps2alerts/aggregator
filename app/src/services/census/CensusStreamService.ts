// @See https://github.com/microwavekonijn/ps2census for further commands (wsClient)

import Service from '../../interfaces/Service';
import PS2EventClient from 'ps2census/dist/client/Client'; // TODO: Await microwave's type fixes
import { getLogger } from '../../logger';
import { injectable } from 'inversify';
import CensusProxy from '../../handlers/census/CensusProxy';

@injectable()
export default class CensusStreamService implements Service {
    private static readonly logger = getLogger('ps2census');
    private subscriptions = [];

    public constructor(
        private readonly wsClient: PS2EventClient,
        private readonly censusProxy: CensusProxy
    ) {
    }

    public async boot(): Promise<void> {
        CensusStreamService.logger.info('Booting Census Stream Service...');
    }

    public async start(): Promise<void> {
        CensusStreamService.logger.info('Starting Census Stream Service...');
        await this.wsClient.connect();

        this.wsClient.on('ready', () => {
            CensusStreamService.logger.info('Census Stream Service connected!');
        });

        // Set up event handlers
        this.wsClient.on('event', (event) => {
            this.censusProxy.handle(event);
        });

        this.wsClient.on('reconnecting', () => {
            CensusStreamService.logger.warn('Census stream connection lost... reconnecting...');
        });

        this.wsClient.on('disconnected', () => {
            CensusStreamService.logger.error('Census stream connection disconnected!');
        });

        this.wsClient.on('error', (error) => {
            CensusStreamService.logger.error(`Census stream error! ${error}`);
        });

        this.wsClient.on('warn', (error) => {
            CensusStreamService.logger.warn(`Census stream warn! ${error}`);
        });
    }

    public async terminate(): Promise<void> {
        CensusStreamService.logger.info('Terminating Census Stream Service!');

        try {
            await this.wsClient.destroy();
        } catch {
            // Fucked
        }
    }
}
