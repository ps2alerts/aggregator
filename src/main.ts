import {NestFactory} from '@nestjs/core';
import AppModule from './AppModule';
import config from './config';

async function bootstrap(): Promise<void> {
    process.on('unhandledRejection', (err) => {
        throw err;
    });

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: config.logger.levels,
    });

    app.enableShutdownHooks();
}

void bootstrap();
