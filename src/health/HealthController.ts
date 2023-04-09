import {Controller, Get} from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HttpHealthIndicator,
    MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import {MicroserviceOptions, RedisOptions, RmqOptions, Transport} from '@nestjs/microservices';
import {ConfigService} from '@nestjs/config';

@Controller('health')
export class HealthController {
    constructor(
        private readonly config: ConfigService,
        private readonly health: HealthCheckService,
        private readonly http: HttpHealthIndicator,
        private readonly microservice: MicroserviceHealthIndicator,
    ) {
    }

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.http.pingCheck('api', `${this.config.get('internalApi.host')}/healthcheck`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            () => this.microservice.pingCheck<RedisOptions>('redis', {
                transport: Transport.REDIS,
                options: {
                    host: this.config.get('redis.host'),
                    port: this.config.get('redis.port'),
                    password: this.config.get('redis.password'),
                },
            }),
            () => this.microservice.pingCheck<MicroserviceOptions>('rabbitmq', {
                transport: Transport.RMQ,
                options: {
                    urls: this.config.get('rabbitmq.urls'),
                },
            } satisfies RmqOptions),
        ]);
    }
}
