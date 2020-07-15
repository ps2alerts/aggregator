import {getLogger} from '../../logger';
import ServiceInterface from '../../interfaces/ServiceInterface';
import {Connection, ConnectionOptions, createConnection} from 'typeorm';
import Database from '../../config/database';
import {injectable} from 'inversify';
import {AlertEntity} from '../../entites/AlertEntity';

@injectable()
export default class TypeOrmService implements ServiceInterface {
    private static readonly logger = getLogger('typeorm');

    private readonly dbConfig: Database;

    constructor(dbConfig: Database) {
        this.dbConfig = dbConfig;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        TypeOrmService.logger.info('Booting TypeORM (NOT IMPLEMENTED)');
    }

    public async start(): Promise<void> {
        TypeOrmService.logger.info('Starting TypeORM Service...');
        const config = this.dbConfig.config;
        const connStr = `mongodb://${config.user}:${config.pass}@${config.host}:${config.port}?authSource=admin`;

        const connectionOptions: ConnectionOptions = {
            type: 'mongodb',
            url: connStr,
            entities: [
                AlertEntity,
            ],
            migrations: ['src/migrations/**/*.ts'],
            synchronize: true,
            logging: 'all',
        };

        createConnection(connectionOptions).then((connection: Connection) => {
            TypeOrmService.logger.info('TypeORM connected to Mongo');
        }).catch((error) => {
            TypeOrmService.logger.error('TypeORM unable to connect to Mongo!');
            console.log(error);
        });
    }

    public terminate(): void {
        TypeOrmService.logger.info('Terminating TypeORM Service (NOT IMPLEMENTED)');
    }
}
