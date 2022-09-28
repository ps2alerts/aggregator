import {Logger, Module, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import Redis from 'ioredis';
import config from '../../config';

@Module({
    providers: [
        {
            provide: Redis,
            useFactory: () => new Redis(config.redis),
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
