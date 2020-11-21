import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import MongoDBConnection from './MongoDBConnection';

@injectable()
export default class MongoDatabaseConnectionService implements ServiceInterface {
    public readonly bootPriority = 10;
    private static readonly logger = getLogger('MongoDatabaseConnectionService');
    private readonly dbClient: MongoDBConnection;

    constructor(dbClient: MongoDBConnection) {
        this.dbClient = dbClient;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        MongoDatabaseConnectionService.logger.debug('Booting Mongo Database Connection Service...');
        await this.dbClient.getConnection();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        MongoDatabaseConnectionService.logger.debug('Starting Mongo Database Connection Service... (NOT IMPLEMENTED)');
    }

    // This isn't implemented as it appears to do it automatically
    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        MongoDatabaseConnectionService.logger.warn('Terminating Mongo Database Connection... (NOT IMPLEMENTED');
    }
}
