import {injectable, postConstruct} from 'inversify';
import {getLogger} from '../../logger';
import ApplicationException from '../../exceptions/ApplicationException';
import Redis, {Redis as RedisInterface, RedisOptions} from 'ioredis';
import config from '../../config';

@injectable()
export class RedisConnectionFactory {
    public client: RedisInterface;
    private static readonly logger = getLogger('RedisConnectionFactory');
    private readonly config: RedisOptions = config.redis;
    private readonly maxAttempts = 3;
    private readonly retryTime = 7500;

    constructor() {
        RedisConnectionFactory.logger.debug('Redis Connection Constructor');
    }

    public createClient(): RedisInterface {
        return this.client;
    }

    @postConstruct()
    private async initClient(): Promise<void> {
        RedisConnectionFactory.logger.debug('Initialising Redis client...');

        await this.tryConnection();

        RedisConnectionFactory.logger.info('Redis Client ready!');
    }

    private async tryConnection(attempts = 0): Promise<boolean> {
        attempts++;

        if (attempts > this.maxAttempts) {
            throw new ApplicationException(`PS2Alerts Redis dead after ${this.maxAttempts} attempts! Killing application!!!`, 'RedisConnectionService');
        }

        RedisConnectionFactory.logger.debug(`Attempting to connect to PS2Alerts Redis - Attempt #${attempts}`);

        try {
            this.client = new Redis(this.config);
        } catch (err) {
            if (err instanceof Error) {
                RedisConnectionFactory.logger.warn(`PS2Alerts Redis not online! Err: ${err.message} Waiting...`);
            }

            await this.delay(this.retryTime);
            await this.tryConnection(attempts);
        }

        return true;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
