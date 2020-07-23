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
import {AlertSchemaInterface, alertSchema} from '../../models/AlertModel';
import {AlertDeathSchemaInterface, alertDeathSchema} from '../../models/AlertDeathModel';
import {activeAlertSchema, ActiveAlertSchemaInterface} from '../../models/ActiveAlertModel';
// Alert Aggregate Models
import {AlertFacilityControlInterface, alertFacilityControlSchema} from '../../models/AlertFacilityControlModel';
import {alertFacilityControlAggregateSchema, AlertFacilityControlAggregateInterface} from '../../models/aggregate/alert/AlertFacilityControlAggregateModel';
import {alertFactionCombatAggregateSchema, AlertFactionCombatAggregateSchemaInterface} from '../../models/aggregate/alert/AlertFactionCombatAggregateModel';
import {alertWeaponAggregateSchema, AlertWeaponAggregateSchemaInterface} from '../../models/aggregate/alert/AlertWeaponAggregateModel';
// Global Aggregate Models
import {globalWeaponAggregateSchema, GlobalWeaponAggregateSchemaInterface} from '../../models/aggregate/global/GlobalWeaponAggregateModel';
import {alertPlayerAggregateSchema, AlertPlayerAggregateSchemaInterface} from '../../models/aggregate/alert/AlertPlayerAggregateModel';
import {globalPlayerAggregateSchema, GlobalPlayerAggregateSchemaInterface} from '../../models/aggregate/global/GlobalPlayerAggregateModel';
// World Aggregate Imports
import {WorldFacilityControlAggregateInterface, worldFacilityControlAggregateSchema} from '../../models/aggregate/world/WorldFacilityControlAggregateModel';
import {
    globalFactionCombatAggregateSchema,
    GlobalFactionCombatAggregateSchemaInterface,
} from '../../models/aggregate/global/GlobalFactionCombatAggregateModel';

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
            'alert',
            alertSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<AlertDeathSchemaInterface>>(TYPES.alertDeathModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'alert_death',
            alertDeathSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<ActiveAlertSchemaInterface>>(TYPES.activeAlertDataModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'active_alerts',
            activeAlertSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<AlertFacilityControlInterface>>(TYPES.alertFacilityControlModelFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'alert_facility_control',
            alertFacilityControlSchema,
        ))
        .inSingletonScope();

    // Aggregate Handler Models
    // Alert Aggregates

    bind<MongooseModelFactory<AlertFacilityControlAggregateInterface>>(TYPES.alertFacilityControlAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_alert_facility_control',
            alertFacilityControlAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<AlertFactionCombatAggregateSchemaInterface>>(TYPES.alertFactionCombatAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_alert_faction_combat',
            alertFactionCombatAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<AlertPlayerAggregateSchemaInterface>>(TYPES.alertPlayerAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_alert_player',
            alertPlayerAggregateSchema,
        ))
        .inSingletonScope();

    bind<MongooseModelFactory<AlertWeaponAggregateSchemaInterface>>(TYPES.alertWeaponAggregateFactory)
        .toDynamicValue(({container}: Context) => new MongooseModelFactory(
            container.get(Mongoose),
            'aggregate_alert_weapon',
            alertWeaponAggregateSchema,
        ))
        .inSingletonScope();

    // Global Aggregates

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
