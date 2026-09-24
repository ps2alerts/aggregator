import {NestFactory} from '@nestjs/core';
import AppModule from './AppModule';
import {FastifyAdapter} from '@nestjs/platform-fastify';
import {Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {FastifyInstance} from 'fastify';
import {isMetricsRequestAllowed, metricsAllowList} from './metrics-access';

async function bootstrap(): Promise<void> {
    process.on('uncaughtException', (err) => {
        const logger = new Logger('Exception');

        logger.error(err);

        process.exit(1);
    });

    const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
        bufferLogs: true,
        autoFlushLogs: false,
    });

    const config = await app.resolve(ConfigService);

    app.useLogger(config.get('logger.levels'));
    app.flushLogs();

    app.enableShutdownHooks();

    const allowList = metricsAllowList(process.env.METRICS_ALLOWED_CIDRS);
    (app.getHttpAdapter().getInstance() as FastifyInstance).addHook('onRequest', (request, reply, done) => {
        if (request.routerPath === '/metrics' && !isMetricsRequestAllowed(allowList, request.ip, request.headers)) {
            void reply.code(403).send({error: 'Forbidden'});
            return;
        }

        done();
    });

    await app.listen(config.get('app.port'), '0.0.0.0');
}

void bootstrap();
