import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import MongoDBConnection from './MongoDBConnection';

@injectable()
export default class MongoDatabaseConnectionService implements ServiceInterface {
    private static readonly logger = getLogger('MongoDatabaseConnectionService');

    private readonly dbClient: MongoDBConnection;

    constructor(dbClient: MongoDBConnection) {
        this.dbClient = dbClient;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        MongoDatabaseConnectionService.logger.info('Booting Mongo Database Connection Service...');
        await this.dbClient.getConnection();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        MongoDatabaseConnectionService.logger.info('Starting Mongo Database Connection Service... (NOT IMPLEMENTED)');
    }

    public async terminate(): Promise<void> {
        MongoDatabaseConnectionService.logger.info('Terminating Mongo Database Connection...');
        await this.dbClient.terminateConnection();
    }
}
