import {NestFactory} from '@nestjs/core';
import AppModule from './AppModule';
import {FastifyAdapter} from '@nestjs/platform-fastify';
import {Logger} from '@nestjs/common';
import {ConfigService} from "@nestjs/config";

async function bootstrap(): Promise<void> {
    process.on('uncaughtException', (err) => {
        const logger = new Logger('Exception');

        logger.error(err);

        process.exit(1);
    });

    const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
        bufferLogs: true,
    });

    const config = await app.resolve(ConfigService);

    app.useLogger(config.get('logger.levels'));

    app.enableShutdownHooks();

    await app.listen(config.get('app.port'), '0.0.0.0');
}

void bootstrap();
