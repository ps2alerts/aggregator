import {Logger, Module, OnApplicationBootstrap, OnApplicationShutdown, Scope} from '@nestjs/common';
import InstanceAuthority from './authorities/InstanceAuthority';
import OverdueInstanceAuthority from './authorities/OverdueInstanceAuthority';
import PopulationAuthority from './authorities/PopulationAuthority';
import QueueAuthority from './authorities/QueueAuthority';
import MetricsAuthority from './authorities/MetricsAuthority';
import CharacterBroker from './brokers/CharacterBroker';
import FacilityDataBroker from './brokers/FacilityDataBroker';
import ItemBroker from './brokers/ItemBroker';
import FakeCharacterFactory from './factories/FakeCharacterFactory';
import FakeItemFactory from './factories/FakeItemFactory';
import InstanceActionFactory from './factories/InstanceActionFactory';
import TerritoryCalculatorFactory from './factories/TerritoryCalculatorFactory';
import GlobalCharacterAggregate from './handlers/aggregate/global/GlobalCharacterAggregate';
import GlobalFacilityControlAggregate from './handlers/aggregate/global/GlobalFacilityControlAggregate';
import GlobalFactionCombatAggregate from './handlers/aggregate/global/GlobalFactionCombatAggregate';
import GlobalLoadoutAggregate from './handlers/aggregate/global/GlobalLoadoutAggregate';
import GlobalOutfitAggregate from './handlers/aggregate/global/GlobalOutfitAggregate';
import GlobalOutfitCapturesAggregate from './handlers/aggregate/global/GlobalOutfitCapturesAggregate';
import GlobalVictoryAggregate from './handlers/aggregate/global/GlobalVictoryAggregate';
import GlobalWeaponAggregate from './handlers/aggregate/global/GlobalWeaponAggregate';
import InstanceCharacterAggregate from './handlers/aggregate/instance/InstanceCharacterAggregate';
import InstanceFacilityControlAggregate from './handlers/aggregate/instance/InstanceFacilityControlAggregate';
import InstanceFactionCombatAggregate from './handlers/aggregate/instance/InstanceFactionCombatAggregate';
import InstanceLoadoutAggregate from './handlers/aggregate/instance/InstanceLoadoutAggregate';
import InstanceOutfitAggregate from './handlers/aggregate/instance/InstanceOutfitAggregate';
import InstanceOutfitCapturesAggregate from './handlers/aggregate/instance/InstanceOutfitCapturesAggregate';
import InstancePopulationAggregate from './handlers/aggregate/instance/InstancePopulationAggregate';
import InstanceWeaponAggregate from './handlers/aggregate/instance/InstanceWeaponAggregate';
import VehicleAggregateHandler from './handlers/aggregate/VehicleAggregateHandler';
import VehicleDeathEventHandler from './handlers/aggregate/VehicleDeathEventHandler';
import DeathEventHandler from './handlers/ps2census/DeathEventHandler';
import FacilityControlEventHandler from './handlers/ps2census/FacilityControlEventHandler';
import GainExperienceEventHandler from './handlers/ps2census/GainExperienceEventHandler';
import MetagameEventEventHandler from './handlers/ps2census/MetagameEventEventHandler';
import VehicleDestroyEventHandler from './handlers/ps2census/VehicleDestroyEventHandler';
import AdminAggregatorMessageHandler from './handlers/AdminAggregatorMessageHandler';
import CharacterPresenceHandler from './handlers/CharacterPresenceHandler';
import OutfitParticipantCacheHandler from './handlers/OutfitParticipantCacheHandler';
import PopulationHandler from './handlers/PopulationHandler';
import ZoneDataParser from './parsers/ZoneDataParser';
import AuthorityService from './modules/authorities/AuthorityService';
import RabbitMQModule from './modules/rabbitmq/RabbitMQModule';
import RedisModule from './modules/redis/RedisModule';
import CensusModule from './modules/census/CensusModule';
import PS2AlertsApiModule from './modules/ps2alerts-api/PS2AlertsApiModule';
import {TYPES} from './constants/types';
import MessageQueueHandlerInterface from './interfaces/MessageQueueHandlerInterface';
import PopulationData from './data/PopulationData';
import AggregateHandlerInterface from './interfaces/AggregateHandlerInterface';
import VehicleDestroyEvent from './handlers/ps2census/events/VehicleDestroyEvent';
import DeathEvent from './handlers/ps2census/events/DeathEvent';
import FacilityControlEvent from './handlers/ps2census/events/FacilityControlEvent';
import {PS2EventQueueMessageHandlerInterface} from './interfaces/PS2EventQueueMessageHandlerInterface';
import AdminAggregatorSubscriber from './subscribers/AdminAggregatorSubscriber';
import MetagameSubscriber from './subscribers/MetagameSubscriber';
import {HealthModule} from './health/HealthModule';
import {Death} from 'ps2census';
import {ConfigModule} from '@nestjs/config';
import {config} from './config';
import MetricsModule from './modules/metrics/MetricsModule';
import {PS2AlertsApiDriver} from './drivers/PS2AlertsApiDriver';
import {FalconRequestDriver} from './drivers/FalconRequestDriver';
import {CensusRequestDriver} from './drivers/CensusRequestDriver';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [config],
            expandVariables: true,
        }),
        HealthModule,
        RedisModule,
        RabbitMQModule,
        CensusModule,
        PS2AlertsApiModule,
        MetricsModule,
    ],
    providers: [
        // TODO: Split this monstrosity into separate modules with some sort of hierarchy
        // Authorities
        InstanceAuthority,
        OverdueInstanceAuthority,
        PopulationAuthority,
        QueueAuthority,
        MetricsAuthority,

        // Brokers
        CharacterBroker,
        FacilityDataBroker,
        ItemBroker,

        // Factories
        FakeCharacterFactory,
        FakeItemFactory,
        InstanceActionFactory,
        TerritoryCalculatorFactory,

        // Handlers
        GlobalCharacterAggregate,
        GlobalFacilityControlAggregate,
        GlobalFactionCombatAggregate,
        GlobalLoadoutAggregate,
        GlobalOutfitAggregate,
        GlobalOutfitCapturesAggregate,
        GlobalVictoryAggregate,
        GlobalWeaponAggregate,

        InstanceCharacterAggregate,
        InstanceFacilityControlAggregate,
        InstanceFactionCombatAggregate,
        InstanceLoadoutAggregate,
        InstanceOutfitAggregate,
        InstanceOutfitCapturesAggregate,
        InstancePopulationAggregate,
        InstanceWeaponAggregate,

        VehicleAggregateHandler,
        VehicleDeathEventHandler,

        DeathEventHandler,
        FacilityControlEventHandler,
        GainExperienceEventHandler,
        MetagameEventEventHandler,
        VehicleDestroyEventHandler,

        AdminAggregatorMessageHandler,
        CharacterPresenceHandler,
        OutfitParticipantCacheHandler,
        PopulationHandler,

        // Parsers
        ZoneDataParser,

        // Services
        AuthorityService,

        // Subscribers
        AdminAggregatorSubscriber,
        MetagameSubscriber,

        // Drivers
        CensusRequestDriver,
        PS2AlertsApiDriver,
        FalconRequestDriver,

        // Multi injects
        {
            provide: TYPES.populationAggregates,
            useFactory: (...aggregates: Array<MessageQueueHandlerInterface<PopulationData>>) => aggregates,
            inject: [
                InstancePopulationAggregate,
            ],
            scope: Scope.TRANSIENT,
        },
        {
            provide: TYPES.vehicleDestroyAggregates,
            useFactory: (...aggregates: Array<AggregateHandlerInterface<VehicleDestroyEvent>>) => aggregates,
            inject: [
                VehicleAggregateHandler,
            ],
            scope: Scope.TRANSIENT,
        },
        {
            provide: TYPES.deathAggregates,
            useFactory: (...aggregates: Array<AggregateHandlerInterface<DeathEvent>>) => aggregates,
            inject: [
                GlobalCharacterAggregate,
                GlobalFactionCombatAggregate,
                GlobalLoadoutAggregate,
                GlobalOutfitAggregate,
                GlobalWeaponAggregate,
                InstanceCharacterAggregate,
                InstanceFactionCombatAggregate,
                InstanceLoadoutAggregate,
                InstanceOutfitAggregate,
                InstanceWeaponAggregate,
                VehicleDeathEventHandler,
            ],
            scope: Scope.TRANSIENT,
        },
        {
            provide: TYPES.facilityControlAggregates,
            useFactory: (...aggregates: Array<AggregateHandlerInterface<FacilityControlEvent>>) => aggregates,
            inject: [
                GlobalFacilityControlAggregate,
                InstanceFacilityControlAggregate,
                InstanceOutfitCapturesAggregate,
                GlobalOutfitCapturesAggregate,
            ],
            scope: Scope.TRANSIENT,
        },
        {
            provide: TYPES.eventInstanceHandlers,
            useFactory: (...handlers: Array<PS2EventQueueMessageHandlerInterface<Death>>) => handlers,
            inject: [
                DeathEventHandler,
                FacilityControlEventHandler,
                GainExperienceEventHandler,
                VehicleDestroyEventHandler,
            ],
            scope: Scope.TRANSIENT,
        },
        // There was also a gainexperience aggregate, but it was commented out
    ],
})
export default class AppModule implements OnApplicationShutdown, OnApplicationBootstrap {
    private readonly logger = new Logger('App');

    public onApplicationBootstrap(): void {
        this.logger.log('Houston we are go for launch!');
    }

    public onApplicationShutdown(): void {
        this.logger.log('Goodbye :)');
    }
}
