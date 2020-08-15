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
import {InstanceDeathSchemaInterface, instanceDeathSchema} from '../../models/instance/InstanceDeathModel';
// Instance Aggregate Models
import {instanceClassAggregateSchema, InstanceClassAggregateSchemaInterface} from '../../models/aggregate/instance/InstanceClassAggregateModel';
import {InstanceFacilityControlInterface, instanceFacilityControlSchema} from '../../models/instance/InstanceFacilityControlModel';
import {instanceFacilityControlAggregateSchema, InstanceFacilityControlAggregateInterface} from '../../models/aggregate/instance/InstanceFacilityControlAggregateModel';
import {instanceFactionCombatAggregateSchema, InstanceFactionCombatAggregateSchemaInterface} from '../../models/aggregate/instance/InstanceFactionCombatAggregateModel';
import {instancePopulationAggregateSchema, InstancePopulationAggregateSchemaInterface} from '../../models/aggregate/instance/InstancePopulationAggregateModel';
import {instanceCharacterAggregateSchema, InstanceCharacterAggregateSchemaInterface} from '../../models/aggregate/instance/InstanceCharacterAggregateModel';
import {instanceWeaponAggregateSchema, InstanceWeaponAggregateSchemaInterface} from '../../models/aggregate/instance/InstanceWeaponAggregateModel';
// Global Aggregate Models
import {globalClassAggregateSchema, GlobalClassAggregateSchemaInterface} from '../../models/aggregate/global/GlobalClassAggregateModel';
import {globalFactionCombatAggregateSchema, GlobalFactionCombatAggregateSchemaInterface} from '../../models/aggregate/global/GlobalFactionCombatAggregateModel';
import {globalCharacterAggregateSchema, GlobalCharacterAggregateSchemaInterface} from '../../models/aggregate/global/GlobalCharacterAggregateModel';
import {globalWeaponAggregateSchema, GlobalWeaponAggregateSchemaInterface} from '../../models/aggregate/global/GlobalWeaponAggregateModel';
// World Aggregate Imports
import {GlobalFacilityControlAggregateSchemaInterface, globalFacilityControlAggregateSchema} from '../../models/aggregate/global/GlobalFacilityControlAggregateModel';
import {instanceMetagameSchema, InstanceMetagameSchemaInterface} from '../../models/instance/InstanceMetagame';
import {instanceCustomWorldZoneSchema, InstanceCustomWorldZoneSchemaInterface} from '../../models/instance/InstanceCustomWorldZone';
import {characterPresenceSchema} from '../../models/CharacterPresenceModel';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(MongoDatabaseConnectionService);

    bind<Mongoose>(Mongoose)
        .toDynamicValue(() => new Mongoose())
        .inSingletonScope();

    bind<Database>('mongooseConfig').toConstantValue(config.database);

    bind(MongoDBConnection)
        .toSelf()
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceMetagameSchemaInterface>>(TYPES.instanceMetagameModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance_metagame',
            instanceMetagameSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceCustomWorldZoneSchemaInterface>>(TYPES.instanceCustomWorldZoneModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance_custom_world_zone',
            instanceCustomWorldZoneSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstanceDeathSchemaInterface>>(TYPES.instanceDeathModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'instance_death',
            instanceDeathSchema,
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

    bind<MongooseModelFactory<InstanceCharacterAggregateSchemaInterface>>(TYPES.instanceCharacterAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_instance_character',
            instanceCharacterAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<InstancePopulationAggregateSchemaInterface>>(TYPES.instancePopulationAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_instance_population',
            instancePopulationAggregateSchema,
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

    bind<MongooseModelFactory<GlobalFacilityControlAggregateSchemaInterface>>(TYPES.globalFacilityControlAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_facility_control',
            globalFacilityControlAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<GlobalFactionCombatAggregateSchemaInterface>>(TYPES.globalFactionCombatAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_faction_combat',
            globalFactionCombatAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<GlobalCharacterAggregateSchemaInterface>>(TYPES.globalCharacterAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_character',
            globalCharacterAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<GlobalWeaponAggregateSchemaInterface>>(TYPES.globalWeaponAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_global_weapon',
            globalWeaponAggregateSchema,
        ))
        .inSingletonScope();

    // Metric models
    bind<MongooseModelFactory<GlobalWeaponAggregateSchemaInterface>>(TYPES.characterPresenceFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'character_presence',
            characterPresenceSchema,
        ))
        .inSingletonScope();
});
