import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import {RedisConnection} from './RedisConnection';

@injectable()
export default class RedisConnectionService implements ServiceInterface {
    public readonly bootPriority = 10;

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

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        RedisConnectionService.logger.debug('Starting RedisConnection Service... (NOT IMPLEMENTED)');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        RedisConnectionService.logger.warn('Terminating Redis Connection... (NOT IMPLEMENTED)');
        // Nothing to do, it's just a client, it eventually times out
    }
}
