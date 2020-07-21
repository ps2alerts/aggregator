import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import MongoDatabaseConnectionService from './MongoDatabaseConnectionService';
import MongoDBConnection from './MongoDBConnection';
import config from '../../config';
import {Mongoose} from 'mongoose';
import Database from '../../config/database';
import MongooseModelFactory from '../../factories/MongooseModelFactory';
import {AlertSchemaInterface, alertSchema} from '../../models/AlertModel';
import {AlertDeathSchemaInterface, alertDeathSchema} from '../../models/AlertDeathModel';
import {Context} from 'inversify/dts/planning/context';
import {TYPES} from '../../constants/types';
import {activeAlertSchema, ActiveAlertSchemaInterface} from '../../models/ActiveAlertModel';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(MongoDatabaseConnectionService);

    bind<Mongoose>(Mongoose)
        .toDynamicValue(() => new Mongoose())
        .inSingletonScope();

    bind<Database>('mongooseConfig').toConstantValue(config.database);

    bind(MongoDBConnection)
        .toSelf()
        .inSingletonScope();

    bind<MongooseModelFactory<AlertSchemaInterface>>(TYPES.alertModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'Alert',
            alertSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<AlertDeathSchemaInterface>>(TYPES.alertDeathModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'AlertDeath',
            alertDeathSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<ActiveAlertSchemaInterface>>(TYPES.activeAlertDataModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'ActiveAlerts',
            activeAlertSchema,
        ))
        .inSingletonScope();
});
