import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import MongoDatabaseConnectionService from './MongoDatabaseConnectionService';
import MongoDBConnection from './MongoDBConnection';
import config from '../../config';
import {Mongoose} from 'mongoose';
import Database from '../../config/database';
import MongooseModelFactory from '../../factories/MongooseModelFactory';
import {Context} from 'inversify/dts/planning/context';
import {TYPES} from '../../constants/types';
// Event models
import {InstanceSchemaInterface, instanceSchema} from '../../models/InstanceModel';
import {InstanceDeathSchemaInterface, instanceDeathSchema} from '../../models/InstanceDeathModel';
import {activeInstanceSchema, ActiveInstanceSchemaInterface} from '../../models/ActiveInstanceModel';
// Instancce Aggregate Models
import {instanceClassAggregateSchema, InstanceClassAggregateSchemaInterface} from '../../models/aggregate/instance/InstanceClassAggregateModel';
import {InstanceFacilityControlInterface, instanceFacilityControlSchema} from '../../models/InstanceFacilityControlModel';
import {instanceFacilityControlAggregateSchema, InstanceFacilityControlAggregateInterface} from '../../models/aggregate/instance/InstanceFacilityControlAggregateModel';
import {instanceFactionCombatAggregateSchema, InstanceFactionCombatAggregateSchemaInterface} from '../../models/aggregate/instance/InstanceFactionCombatAggregateModel';
import {instancePlayerAggregateSchema, InstancePlayerAggregateSchemaInterface} from '../../models/aggregate/instance/InstancePlayerAggregateModel';
import {instanceWeaponAggregateSchema, InstanceWeaponAggregateSchemaInterface} from '../../models/aggregate/instance/InstanceWeaponAggregateModel';
// Global Aggregate Models
import {globalClassAggregateSchema, GlobalClassAggregateSchemaInterface} from '../../models/aggregate/global/GlobalClassAggregateModel';
import {globalFactionCombatAggregateSchema, GlobalFactionCombatAggregateSchemaInterface} from '../../models/aggregate/global/GlobalFactionCombatAggregateModel';
import {globalPlayerAggregateSchema, GlobalPlayerAggregateSchemaInterface} from '../../models/aggregate/global/GlobalPlayerAggregateModel';
import {globalWeaponAggregateSchema, GlobalWeaponAggregateSchemaInterface} from '../../models/aggregate/global/GlobalWeaponAggregateModel';
// World Aggregate Imports
import {WorldFacilityControlAggregateInterface, worldFacilityControlAggregateSchema} from '../../models/aggregate/world/WorldFacilityControlAggregateModel';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(MongoDatabaseConnectionService);

    bind<Mongoose>(Mongoose)
        .toDynamicValue(() => new Mongoose())
        .inSingletonScope();

    bind<Database>('mongooseConfig').toConstantValue(config.database);

    bind(MongoDBConnection)
        .toSelf()
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceSchemaInterface>>(TYPES.instanceModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance',
            instanceSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceDeathSchemaInterface>>(TYPES.instanceDeathModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance_death',
            instanceDeathSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<ActiveInstanceSchemaInterface>>(TYPES.activeInstanceDataModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'active_instance',
            activeInstanceSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceFacilityControlInterface>>(TYPES.instanceFacilityControlModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance_facility_control',
            instanceFacilityControlSchema,
        ))
        .inSingletonScope();

    // Aggregate Handler Models
    // Instance Aggregates

    bind<MongooseModelFactory<InstanceClassAggregateSchemaInterface>>(TYPES.instanceClassAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_instance_class',
            instanceClassAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceFacilityControlAggregateInterface>>(TYPES.instanceFacilityControlAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_instance_facility_control',
            instanceFacilityControlAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceFactionCombatAggregateSchemaInterface>>(TYPES.instanceFactionCombatAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_instance_faction_combat',
            instanceFactionCombatAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstancePlayerAggregateSchemaInterface>>(TYPES.instancePlayerAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_instance_player',
            instancePlayerAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceWeaponAggregateSchemaInterface>>(TYPES.instanceWeaponAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_instance_weapon',
            instanceWeaponAggregateSchema,
        ))
        .inSingletonScope();

    // Global Aggregates
    bind<MongooseModelFactory<GlobalClassAggregateSchemaInterface>>(TYPES.globalClassAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_class',
            globalClassAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<GlobalFactionCombatAggregateSchemaInterface>>(TYPES.globalFactionCombatAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_faction_combat',
            globalFactionCombatAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<GlobalPlayerAggregateSchemaInterface>>(TYPES.globalPlayerAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_player',
            globalPlayerAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<GlobalWeaponAggregateSchemaInterface>>(TYPES.globalWeaponAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_weapon',
            globalWeaponAggregateSchema,
        ))
        .inSingletonScope();

    // World Aggregates

    bind<MongooseModelFactory<WorldFacilityControlAggregateInterface>>(TYPES.worldFacilityControlAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_world_facility_control',
            worldFacilityControlAggregateSchema,
        ))
        .inSingletonScope();
});
