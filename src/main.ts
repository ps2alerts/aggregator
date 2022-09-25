import {NestFactory} from '@nestjs/core';
import AppModule from './AppModule';
import config from './config';
import {FastifyAdapter} from '@nestjs/platform-fastify';

async function bootstrap(): Promise<void> {
    process.on('unhandledRejection', (err) => {
        throw err;
    });

    const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
        logger: config.logger.levels,
    });

    app.enableShutdownHooks();

    await app.listen(config.app.port, '0.0.0.0');
}

void bootstrap();
