import {ContainerModule, interfaces} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import MongoDatabaseConnectionService from './MongoDatabaseConnectionService';
import MongoDBConnection from './MongoDBConnection';
import config from '../../config';
import {Mongoose} from 'mongoose';
import Database from '../../config/database';
import MongooseModelFactory from '../../factories/MongooseModelFactory';
import {TYPES} from '../../constants/types';
// Census Event models
import {
    instanceFacilityControlSchema,
    InstanceFacilityControlSchemaInterface,
} from '../../models/instance/InstanceFacilityControlModel';
// Instance Type Models
import {
    instanceMetagameTerritorySchema,
    InstanceMetagameTerritorySchemaInterface,
} from '../../models/instance/InstanceMetagameTerritory';
import Context = interfaces.Context;

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(MongoDatabaseConnectionService);

    bind<Mongoose>(Mongoose)
        .toDynamicValue(() => new Mongoose())
        .inSingletonScope();

    bind<Database>('mongooseConfig').toConstantValue(config.database);

    bind(MongoDBConnection)
        .toSelf()
        .inSingletonScope();

    // Census Event Models
    bind<MongooseModelFactory<InstanceFacilityControlSchemaInterface>>(TYPES.instanceFacilityControlModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance_facility_control',
            instanceFacilityControlSchema,
        ))
        .inSingletonScope();

    // Instance Type Models
    bind<MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>>(TYPES.instanceMetagameModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance_metagame_territories',
            instanceMetagameTerritorySchema,
        ))
        .inSingletonScope();
});
