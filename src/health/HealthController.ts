import {Controller, Get} from '@nestjs/common';
import {HealthCheck, HealthCheckResult, HealthCheckService} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
    ) {
    }

    @Get()
    @HealthCheck()
    public check(): Promise<HealthCheckResult> {
        // TODO: Currently empty but can be used to check health or Redis and RabbitMQ
        return this.health.check([]);
    }
}
