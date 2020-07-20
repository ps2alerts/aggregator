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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public buildDocument(document: any): Interface {
        return new (this.model)(document);
    }

    public async saveDocument(document: any): Promise<Interface> {
        const model = new (this.model)(document);
        return await model.save();
    }
}
