export default class censusConnection {
    public async connect():Promise<void> {
        const { Client } = require('ps2census');

        const subscriptions = [{
            worlds: ['10'],
            eventNames: ['MetagameEvent'],
        }];

        const client = new Client('ServiceID', { subscriptions });

        client.on('event', (event) => {
            // Handle the event, for more information see http://census.daybreakgames.com/#websocket-details
        });

        client.on('duplicate', (event) => {}); // When a duplicate event has been received
        client.on('ready', () => {}); // Client is ready
        client.on('reconnecting', () => {}); // Client is reconnecting
        client.on('disconnected', () => {}); // Client got disconnected
        client.on('error', () => {}); // Error
        client.on('warn', () => {}); // Error, when receiving a corrupt message

        client.connect();
    }
}
