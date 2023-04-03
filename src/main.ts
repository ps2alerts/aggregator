import {NestFactory} from '@nestjs/core';
import AppModule from './AppModule';
import config from './config';
import {FastifyAdapter} from '@nestjs/platform-fastify';
import {Logger} from '@nestjs/common';

async function bootstrap(): Promise<void> {
    process.on('unhandledRejection', (err) => {
        throw err;
    }).on('uncaughtException', (err) => {
        const logger = new Logger('Exception');

        logger.error(err);

        process.exit(1);
    });

    const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
        logger: config.logger.levels,
    });

    app.enableShutdownHooks();

    await app.listen(config.app.port, '0.0.0.0');
}

void bootstrap();
