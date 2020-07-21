import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import MongoDatabaseConnectionService from './MongoDatabaseConnectionService';
import MongoDBConnection from './MongoDBConnection';
import config from '../../config';
import {Mongoose} from 'mongoose';
import Database from '../../config/database';
import MongooseModelFactory from '../../factories/MongooseModelFactory';
import {AlertInterface, alertSchema} from '../../models/AlertModel';
import {AlertDeathInterface, alertDeathSchema} from '../../models/AlertDeathModel';
import {Context} from 'inversify/dts/planning/context';
import {TYPES} from '../../constants/types';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(MongoDatabaseConnectionService);

    bind<Mongoose>(Mongoose)
        .toDynamicValue(() => new Mongoose())
        .inSingletonScope();

    bind<Database>('mongooseConfig').toConstantValue(config.database);

    bind(MongoDBConnection)
        .toSelf()
        .inSingletonScope();

    bind<MongooseModelFactory<AlertInterface>>(TYPES.alertModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'Alert',
            alertSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<AlertDeathInterface>>(TYPES.alertDeathModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'AlertDeath',
            alertDeathSchema,
        ))
        .inSingletonScope();
});
