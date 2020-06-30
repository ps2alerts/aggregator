// import { Client } from
//
// export default class censusStreamService {
//     public constructor(
//         private client: Client
//     ) {
//
//     }
//     public async connect():Promise<void> {
//         // Have to dependency inject this?
//         const { Client } = require('ps2census');
//
//         const subscriptions = [{
//             worlds: ['10'],
//             eventNames: ['MetagameEvent'],
//         }];
//
//         const client = new Client('ServiceID', { subscriptions });
//
//         client.on('event', (event) => {
//             // Handle the event, for more information see http://census.daybreakgames.com/#websocket-details
//         });
//
//         client.on('duplicate', (event) => {}); // When a duplicate event has been received
//         client.on('ready', () => {}); // Client is ready
//         client.on('reconnecting', () => {}); // Client is reconnecting
//         client.on('disconnected', () => {}); // Client got disconnected
//         client.on('error', () => {}); // Error
//         client.on('warn', () => {}); // Error, when receiving a corrupt message
//
//         client.connect();
//     }
// }

import Service, { SERVICE } from '../../interfaces/Service';
import PS2EventClient from 'ps2census/dist/client/Client'; // TODO: Await microwave's type fixes
import { getLogger } from '../../logger';
import { injectable } from 'inversify';

@injectable()
export default class censusStreamService implements Service {
    private static readonly logger = getLogger('ps2census');
    private subscriptions = []

    public constructor(
        private readonly wsClient: PS2EventClient
    ) {
    }

    public async boot(): Promise<void> {
        censusStreamService.logger.info('Booting Census Stream Service')
    }

    public async start(): Promise<void> {
        censusStreamService.logger.info('Starting Census Stream Service')
        console.log("Census hello world!");
        // await this.wsClient.connect();
        censusStreamService.logger.info('Census Stream Service connected!')
    }

    public async terminate(): Promise<void> {
        censusStreamService.logger.info('Terminating Census Stream Service!')

        try {
            await this.wsClient.destroy();
        } catch {
            // Fucked
        }
    }
}
