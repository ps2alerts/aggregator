import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import MongoDBConnection from './MongoDBConnection';

@injectable()
export default class MongoDatabaseConnectionService implements ServiceInterface {
    public readonly bootPriority = 1;
    private static readonly logger = getLogger('MongoDatabaseConnectionService');

    constructor(private readonly dbClient: MongoDBConnection) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        MongoDatabaseConnectionService.logger.debug('Booting Mongo Database Connection Service...');
        await this.dbClient.getConnection();
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async start(): Promise<void> {}

    // This isn't implemented as it appears to do it automatically
    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
