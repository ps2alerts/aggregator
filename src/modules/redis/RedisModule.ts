import {Logger, Module, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import Redis from 'ioredis';
import {ConfigService} from '@nestjs/config';

@Module({
    providers: [
        {
            provide: Redis,
            useFactory: (config: ConfigService) => {
                const redisHost: string = config.get('redis.host');
                const redisPort: number = config.get('redis.port');
                const redisPass: string = config.get('redis.password');
                const redisDb: number = config.get('redis.db');

                console.log(`Connecting to Redis: ${redisHost}:${redisPort}:${redisPass}[${redisDb}]`);

                const redis = new Redis({
                    host: redisHost,
                    port: redisPort,
                    password: redisPass,
                    db: redisDb,
                });

                console.log('Connected to Redis!');
                return redis;
            },
            inject: [ConfigService],
        },
    ],
    exports: [Redis],
})
export default class RedisModule implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger('Redis');

    constructor(
        private readonly redis: Redis,
    ) {
    }

    public onModuleInit(): void {
        this.redis.on('close', () => this.logger.log('Connection closed'))
            .on('reconnecting', () => this.logger.debug('Reconnecting'))
            .on('error', (message) => this.logger.warn(message));
    }

    public onModuleDestroy(): void {
        this.redis.disconnect();
    }
}
