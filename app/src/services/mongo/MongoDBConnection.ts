import mongoose, {Mongoose} from 'mongoose';
import ApplicationException from '../../exceptions/ApplicationException';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import Database, {DatabaseConfig} from '../../config/database';

@injectable()
export default class MongoDBConnection {
    private static readonly logger = getLogger('DatabaseConnection');
    private static isConnected = false;
    private static connecting = false;
    private static db: Mongoose;
    private static dbConfig: Database;

    constructor(dbConfig: Database) {
        MongoDBConnection.dbConfig = dbConfig;
    }

    public async getConnection(): Promise<Mongoose|boolean> {
        if (MongoDBConnection.connecting) {
            MongoDBConnection.logger.info('MongoDBConnection is currently connecting, aborting connection.');
            return false;
        }

        if (MongoDBConnection.isConnected) {
            return MongoDBConnection.db;
        } else {
            try {
                await MongoDBConnection.connect();
                return MongoDBConnection.db;
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`CRITICAL: UNABLE TO OPEN DATABASE CONNECTION! ${error.message ?? error}`, 'database/mongo-connection', 1);
            }
        }
    }

    public async terminateConnection(): Promise<boolean> {
        if (!MongoDBConnection.isConnected) {
            MongoDBConnection.logger.error('terminateConnection was called when not connected!');
            return true;
        }

        try {
            await MongoDBConnection.db.connection.close();
        } catch (error) {
            MongoDBConnection.logger.emerg('Was unable to close the database connection! FUBAR');
            throw new ApplicationException('CRITICAL: UNABLE TO CLOSE DATABASE CONNECTION! FUBAR!', 'database/mongo-connection', 1);
        }

        return true;
    }

    private static async connect(): Promise<void> {
        MongoDBConnection.logger.info('Starting connection...');
        MongoDBConnection.connecting = true;

        const config: DatabaseConfig = MongoDBConnection.dbConfig.config;

        const connStr = `mongodb://${config.user}:${config.pass}@${config.host}:${config.port}?authSource=admin`;
        MongoDBConnection.logger.debug(connStr);

        mongoose.connection.on('connected', function() {
            MongoDBConnection.isConnected = true;
            MongoDBConnection.connecting = false;
            MongoDBConnection.logger.info('Successfully connected to MongoDB database.');
        });

        mongoose.connection.on('disconnected', function() {
            MongoDBConnection.isConnected = false;
            MongoDBConnection.logger.error('Database connection lost!');
            // await MongoDBConnection.connect();
        });

        mongoose.connection.on('error', function(err: Error) {
            MongoDBConnection.logger.error(`Mongo Error! ${err.message}`);
        });

        try {
            await mongoose.connect(connStr, MongoDBConnection.dbConfig.connectionOptions).then((dbConn: Mongoose) => {
                MongoDBConnection.db = dbConn;
            });
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Was unable to create a connection to Mongo! ${error.message}`, 'database/mongo-connection');
        }
    }
}
