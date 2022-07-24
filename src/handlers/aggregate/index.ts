import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../ps2census/events/DeathEvent';
import PopulationData from '../../data/PopulationData';
// Events
import FacilityControlEvent from '../ps2census/events/FacilityControlEvent';
import VehicleDestroyEvent from '../ps2census/events/VehicleDestroyEvent';
// Handlers
import VehicleAggregateHandler from './VehicleAggregateHandler';
import VehicleDeathEventHandler from './VehicleDeathEventHandler';
// Global Aggregates
import GlobalCharacterAggregate from './global/GlobalCharacterAggregate';
import GlobalFacilityControlAggregate from './global/GlobalFacilityControlAggregate';
import GlobalFactionCombatAggregate from './global/GlobalFactionCombatAggregate';
import GlobalLoadoutAggregate from './global/GlobalLoadoutAggregate';
import GlobalOutfitAggregate from './global/GlobalOutfitAggregate';
import GlobalOutfitCapturesAggregate from './global/GlobalOutfitCapturesAggregate';
import GlobalVictoryAggregate from './global/GlobalVictoryAggregate';
import GlobalWeaponAggregate from './global/GlobalWeaponAggregate';
// Instance Aggregates
import InstanceCharacterAggregate from './instance/InstanceCharacterAggregate';
import InstanceFacilityControlAggregate from './instance/InstanceFacilityControlAggregate';
import InstanceFactionCombatAggregate from './instance/InstanceFactionCombatAggregate';
import InstanceLoadoutAggregate from './instance/InstanceLoadoutAggregate';
import InstanceOutfitAggregate from './instance/InstanceOutfitAggregate';
import InstanceOutfitCapturesAggregate from './instance/InstanceOutfitCapturesAggregate';
import InstancePopulationAggregate from './instance/InstancePopulationAggregate';
import InstanceWeaponAggregate from './instance/InstanceWeaponAggregate';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import MessageQueueHandlerInterface from '../../interfaces/MessageQueueHandlerInterface';

export default new ContainerModule((bind) => {
    // Death Event
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalCharacterAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalFactionCombatAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalLoadoutAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalOutfitAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalWeaponAggregate).inSingletonScope();
    // Instance
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceCharacterAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceFactionCombatAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceLoadoutAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceOutfitAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceWeaponAggregate).inSingletonScope();

    // FacilityControl Event
    bind<AggregateHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(GlobalFacilityControlAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(InstanceFacilityControlAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(InstanceOutfitCapturesAggregate).inSingletonScope();
    bind<AggregateHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(GlobalOutfitCapturesAggregate).inSingletonScope();

    // Population Event
    bind<MessageQueueHandlerInterface<PopulationData>>(TYPES.populationAggregates).to(InstancePopulationAggregate).inSingletonScope();

    // Vehicle Destroy Event
    bind<AggregateHandlerInterface<VehicleDestroyEvent>>(TYPES.vehicleDestroyAggregates).to(VehicleAggregateHandler).inSingletonScope();
    bind<AggregateHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(VehicleDeathEventHandler).inSingletonScope();

    // Victory Aggregator
    bind<AggregateHandlerInterface<MetagameTerritoryInstance>>(TYPES.globalVictoryAggregate).to(GlobalVictoryAggregate).inSingletonScope();
});
