import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {RmqOptions, Transport} from '@nestjs/microservices';
import {ConfigService} from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    app.connectMicroservice<RmqOptions>({
        transport: Transport.RMQ,
        options: config.get('rabbitmq'),
    });

    await app.startAllMicroservicesAsync();
}

void bootstrap();
