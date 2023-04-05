import {Logger, Module, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import Redis from 'ioredis';
import {ConfigService} from "@nestjs/config";

@Module({
    providers: [
        {
            provide: Redis,
            useFactory: (config: ConfigService) => new Redis({
                host: config.get('redis.host'),
                port: config.get('redis.port'),
                password: config.get('redis.password')
            }),
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
