import {Db} from 'mongodb';
import {injectable} from 'inversify';
import {MongoDBConnection} from './MongoDBConnection';

@injectable()
export class MongoDBClient {
    private db: MongoDBConnection;

    constructor() {
        MongoDBConnection.getConnection((connection: MongoDBConnection) => {
            this.db = connection;
        });
    }

    public findOneById(collection: string, objectId: string, result: (error, data) => void): void {
        MongoDBClient.db.collection(collection).find({_id: new ObjectID(objectId)}).limit(1).toArray((error, find) => {
            return result(error, find[0]);
        });
    }

    public insert(collection: string, model: User, result: (error, data) => void): void {
        this.db.collection(collection).insertOne(model, (error, insert) => {
            return result(error, insert.ops[0]);
        });
    }

    public update(collection: string, objectId: string, model: User, result: (error, data) => void): void {
        this.db.collection(collection).updateOne(
            {_id: new ObjectID(objectId)},
            {$set: model},
            (error, update) => result(error, model),
        );
    }

    public remove(collection: string, objectId: string, result: (error, data) => void): void {
        this.db.collection(collection).deleteOne({_id: new ObjectID(objectId)}, (error, remove) => {
            return result(error, remove);
        });
    }
}
