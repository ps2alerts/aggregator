import {Mongoose, Model, Document, Schema} from 'mongoose';
import {injectable} from 'inversify';

@injectable()
export default class MongooseModelFactory<Interface extends Document> {
    public readonly model: Model<Interface>;
    private readonly dbConnection: Mongoose;

    constructor(
        mongoose: Mongoose,
        collection: string,
        schema: Schema,
    ) {
        this.dbConnection = mongoose;
        this.model = mongoose.model<Interface>(collection, schema);
    }
}
