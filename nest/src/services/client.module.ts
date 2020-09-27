import {ClientsModule, RmqOptions, Transport} from '@nestjs/microservices';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {API_SERVICE} from '../constants/client.constants';

export const ClientModule = ClientsModule.registerAsync([{
    name: API_SERVICE,
    imports: [ConfigModule],
    inject: [ConfigModule],
    useFactory: (config: ConfigService): RmqOptions => ({
        transport: Transport.RMQ,
        options: config.get('api'),
    }),
}]);
