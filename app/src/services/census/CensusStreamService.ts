// @See https://github.com/microwavekonijn/ps2census for further commands (wsClient)

import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import CensusProxy from '../../handlers/census/CensusProxy';
import {Client, Events, MetagameEvent} from 'ps2census';
import {getUnixTimestamp} from '../../utils/time';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    private static readonly logger = getLogger('ps2census');

    private readonly wsClient: Client;
    private readonly censusProxy: CensusProxy;
    private readonly subscriptions = [];

    constructor(wsClient: Client, censusProxy: CensusProxy) {
        this.wsClient = wsClient;
        this.censusProxy = censusProxy;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusStreamService.logger.info('Booting Census Stream Service... (NOT IMPLEMENTED)');
    }

    public async start(): Promise<void> {
        CensusStreamService.logger.info('Starting Census Stream Service...');
        await this.wsClient.watch();

        this.wsClient.on('ready', () => {
            CensusStreamService.logger.info('Census Stream Service connected!');

            // TEMP TEMP TEMP
            const event = new MetagameEvent(this.wsClient, {
                event_name: 'MetagameEvent',
                experience_bonus: '25.000000',
                faction_nc: '6.274510',
                faction_tr: '19.607843',
                faction_vs: '9.803922',
                instance_id: '12358',
                metagame_event_id: '190',
                metagame_event_state: '137',
                metagame_event_state_name: 'started',
                timestamp: String(getUnixTimestamp()),
                world_id: '10',
            });
            this.wsClient.emit(Events.PS2_META_EVENT, event);
            CensusStreamService.logger.info('Emitted Metagame Start event');

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

    public terminate(): void {
        CensusStreamService.logger.info('Terminating Census Stream Service!');

        try {
            this.wsClient.destroy();
        } catch {
            // Fucked
        }
    }
}
