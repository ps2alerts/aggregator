import {Mongoose, Model, Document, Schema} from 'mongoose';
import {injectable} from 'inversify';

@injectable()
export default class MongooseModelFactory<Sch extends Document> {
    public readonly model: Model<Sch>;
    private readonly dbConnection: Mongoose;

    constructor(
        mongoose: Mongoose,
        collection: string,
        schema: Schema,
    ) {
        this.dbConnection = mongoose;
        this.model = mongoose.model<Sch>(collection, schema);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    public build(document: any): Sch {
        return new (this.model)(document);
    }
}
