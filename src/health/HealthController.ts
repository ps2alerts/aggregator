import {Controller, Get} from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckResult,
    HealthCheckService,
    HttpHealthIndicator,
    MicroserviceHealthIndicator
} from '@nestjs/terminus';
import config from '../config';
import {MicroserviceOptions, RedisOptions, Transport} from '@nestjs/microservices';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly http: HttpHealthIndicator,
        private readonly microservice: MicroserviceHealthIndicator,
    ) {
    }

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        return this.health.check([
            () => this.http.pingCheck('api', config.internalApi.host, {
                headers: {
                    'Content-Type': 'application/json',
                },
                auth: {
                    username: config.internalApi.username,
                    password: config.internalApi.password,
                },
            }),
            () => this.microservice.pingCheck<RedisOptions>('redis', {
                transport: Transport.REDIS,
                options: config.redis,
            }),
            () => this.microservice.pingCheck<MicroserviceOptions>('rabbitmq', {
                transport: Transport.RMQ,
                options: {
                    urls: config.rabbitmq.connectionUrl,
                },
            }),
        ]);
    }
}
