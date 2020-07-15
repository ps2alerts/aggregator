import {getLogger} from '../../logger';
import ServiceInterface from '../../interfaces/ServiceInterface';
import {Connection, ConnectionOptions, createConnection} from 'typeorm';
import Database from '../../config/database';
import {injectable} from 'inversify';
import {Alert} from '../../entities/Alert';
import {World} from '../../constants/world';
import {AlertState} from '../../constants/alertState';
import {Zone} from '../../constants/zone';
import {getUnixTimestamp} from '../../utils/time';

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

        createConnection(connectionOptions).then((connection: Connection) => {
            TypeOrmService.logger.info('TypeORM connected to Mongo');

            const alert = new Alert();
            alert.worldId = World.MILLER;
            alert.zoneId = Zone.INDAR;
            alert.state = AlertState.STARTED;
            alert.timestampStarted = getUnixTimestamp();

            connection.manager.save(alert).then((alert) => {
                console.log(`Alert saved! ID: ${alert.id}`);
            });
        }).catch((error) => {
            TypeOrmService.logger.error('TypeORM unable to connect to Mongo!');
            console.log(error);
        });
    }

    public terminate(): void {
        TypeOrmService.logger.info('Terminating TypeORM Service (NOT IMPLEMENTED)');
    }
}
