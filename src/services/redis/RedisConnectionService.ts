import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import {RedisConnection} from './RedisConnection';

@injectable()
export default class RedisConnectionService implements ServiceInterface {
    public readonly bootPriority = 3;
    private static readonly logger = getLogger('RedisConnectionService');
    private readonly redisConnection: RedisConnection;

    constructor(redisConnection: RedisConnection) {
        this.redisConnection = redisConnection;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        RedisConnectionService.logger.debug('Booting RedisConnection Service...');
        this.redisConnection.getClient();
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async start(): Promise<void> {}

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
