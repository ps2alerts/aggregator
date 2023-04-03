import App from './app';
import Census from './census';
import Features from './features';
import Logger from './logger';
import InternalApi from './internal-api';
import RabbitMQ from './rabbitmq';
import Redis from './redis';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Holds the configuration information for various aspects of the application.
 */
export class Config {
    public readonly app: App = new App();
    public readonly census: Census = new Census();
    public readonly features = Features;
    public readonly logger: Logger = new Logger();
    public readonly internalApi: InternalApi = new InternalApi();
    public readonly rabbitmq: RabbitMQ = new RabbitMQ();
    public readonly redis: Redis = new Redis();
}

// This is needed here otherwise we get circular reference issues (e.g. logger calling config for logger information...)
export default new Config();
