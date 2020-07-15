import {getLogger} from '../../logger';
import ServiceInterface from '../../interfaces/ServiceInterface';
import {Connection, ConnectionOptions, createConnection} from 'typeorm';
import Database from '../../config/database';
import {injectable} from 'inversify';
import {Alert} from '../../entities/Alert';

@injectable()
export default class TypeOrmConnection implements ServiceInterface {
    public connection: Connection;

    private static readonly logger = getLogger('typeorm');

    private readonly dbConfig: Database;

    constructor(dbConfig: Database) {
        this.dbConfig = dbConfig;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        TypeOrmConnection.logger.info('Booting TypeORM (NOT IMPLEMENTED)');
    }

    public async start(): Promise<void> {
        TypeOrmConnection.logger.info('Starting TypeORM Service...');
        const config = this.dbConfig.config;
        const connStr = `mongodb://${config.user}:${config.pass}@${config.host}:${config.port}/${config.schema}`;

        const connectionOptions: ConnectionOptions = {
            type: 'mongodb',
            url: connStr,
            database: config.schema, // Doesn't seem to do anything
            entities: [
                Alert,
            ],
            migrations: ['src/migrations/**/*.ts'],
            synchronize: true,
            logging: 'all',
            authSource: 'admin',
            useNewUrlParser: true,
        };

        await createConnection(connectionOptions).then((connection: Connection) => {
            TypeOrmConnection.logger.info('TypeORM connected to Mongo and available');
            this.connection = connection;
        }).catch((error) => {
            TypeOrmConnection.logger.error('TypeORM unable to connect to Mongo!');
            TypeOrmConnection.logger.error(error);
        });
    }

    public terminate(): void {
        TypeOrmConnection.logger.info('Terminating TypeORM Service (NOT IMPLEMENTED)');
    }
}
