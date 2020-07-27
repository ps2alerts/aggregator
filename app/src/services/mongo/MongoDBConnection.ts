import {Mongoose} from 'mongoose';
import ApplicationException from '../../exceptions/ApplicationException';
import {getLogger} from '../../logger';
import {inject, injectable} from 'inversify';
import Database from '../../config/database';

@injectable()
export default class MongoDBConnection {
    private static readonly logger = getLogger('DatabaseConnection');

    /**
     * @type {boolean} true if connected successfully
     */
    private isConnected = false;

    /**
     * @type {boolean} true if currently connecting
     */
    private isConnecting = false;

    /**
     * @type {Mongoose} mongoose instance
     */
    private readonly db: Mongoose;

    /**
     * @type {Database} configuration used while connecting
     */
    private readonly dbConfig: Database;

    /**
     * @param {Mongoose} db mongoose instance
     * @param {Database} dbConfig configuration used while connecting
     */
    constructor(db: Mongoose, @inject('mongooseConfig') dbConfig: Database) {
        this.db = db;
        this.dbConfig = dbConfig;

        this.prepareMongoose();
    }

    /**
     * Get current connection or not
     *
     * @return {Promise<Mongoose | boolean>}
     */
    public async getConnection(): Promise<Mongoose | boolean> {
        if (this.isConnecting) {
            MongoDBConnection.logger.warn('MongoDBConnection is currently connecting, aborting connection.');
            return false;
        }

        if (this.isConnected) {
            return this.db;
        } else {
            try {
                await this.connect();
                return this.db;
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`CRITICAL: UNABLE TO OPEN DATABASE CONNECTION! ${error.message ?? error}`, 'database/mongo-connection', 1);
            }
        }
    }

    /**
     * Destroy current connection
     *
     * @return {Promise<boolean>}
     */
    public async terminateConnection(): Promise<boolean> {
        if (!this.isConnected) {
            MongoDBConnection.logger.error('terminateConnection was called when not connected!');
            return true;
        }

        try {
            await this.db.connection.close();
        } catch (error) {
            MongoDBConnection.logger.error('Was unable to close the database connection! FUBAR');
            throw new ApplicationException('CRITICAL: UNABLE TO CLOSE DATABASE CONNECTION! FUBAR!', 'database/mongo-connection', 1);
        }

        return true;
    }

    /**
     * Initiates connection
     */
    private async connect(): Promise<void> {
        MongoDBConnection.logger.debug('Starting connection...');
        this.isConnecting = true;

        const {config} = this.dbConfig;

        const connStr = `mongodb://${config.user}:${config.pass}@${config.host}:${config.port}/${config.schema}?authSource=admin`;
        MongoDBConnection.logger.debug(connStr);

        try {
            await this.db.connect(connStr, this.dbConfig.connectionOptions);

            if (config.debug) {
                this.db.set('debug', true);
            }
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Was unable to create a connection to Mongo! ${error.message}`, 'database/mongo-connection');
        }
    }

    /**
     * Add some listeners to mongoose connection
     */
    private prepareMongoose(): void {
        this.db.connection.on('connected', () => {
            this.isConnected = true;
            this.isConnecting = false;
            MongoDBConnection.logger.info('Successfully connected to MongoDB database.');
        });

        this.db.connection.on('disconnected', () => {
            this.isConnected = false;
            MongoDBConnection.logger.error('Database connection lost!');
        });

        this.db.connection.on('error', (err: Error) => {
            MongoDBConnection.logger.error(`Mongo Error! ${err.message}`);
        });
    }
}
