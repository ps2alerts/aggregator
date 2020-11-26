import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import PopulationHandlerInterface from '../../interfaces/PopulationHandlerInterface';
import PopulationData from '../../data/PopulationData';
// Events
import FacilityControlEvent from '../census/events/FacilityControlEvent';
import VehicleDestroyEvent from '../census/events/VehicleDestroyEvent';
// Handlers
import VehicleAggregateHandler from './VehicleAggregateHandler';
import VehicleDeathEventHandler from './VehicleDeathEventHandler';
// Global Aggregates
import GlobalCharacterAggregate from './global/GlobalCharacterAggregate';
import GlobalFacilityControlAggregate from './global/GlobalFacilityControlAggregate';
import GlobalFactionCombatAggregate from './global/GlobalFactionCombatAggregate';
import GlobalLoadoutAggregate from './global/GlobalLoadoutAggregate';
import GlobalOutfitAggregate from './global/GlobalOutfitAggregate';
import GlobalWeaponAggregate from './global/GlobalWeaponAggregate';
// Instance Aggregates
import InstanceCharacterAggregate from './instance/InstanceCharacterAggregate';
import InstanceFacilityControlAggregate from './instance/InstanceFacilityControlAggregate';
import InstanceFactionCombatAggregate from './instance/InstanceFactionCombatAggregate';
import InstanceLoadoutAggregate from './instance/InstanceLoadoutAggregate';
import InstanceOutfitAggregate from './instance/InstanceOutfitAggregate';
import InstancePopulationAggregate from './instance/InstancePopulationAggregate';
import InstanceWeaponAggregate from './instance/InstanceWeaponAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handlers are registered here
    // Death Event
    // Global
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalCharacterAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalLoadoutAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalOutfitAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalWeaponAggregate).inSingletonScope();
    // Instance
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceCharacterAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceLoadoutAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceOutfitAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceWeaponAggregate).inSingletonScope();

    // FacilityControl Event
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(GlobalFacilityControlAggregate).inSingletonScope();
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(InstanceFacilityControlAggregate).inSingletonScope();

    // Population Event
    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationAggregates).to(InstancePopulationAggregate).inSingletonScope();

    // Vehicle Destroy Event
    bind<EventHandlerInterface<VehicleDestroyEvent>>(TYPES.vehicleDestroyAggregates).to(VehicleAggregateHandler).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(VehicleDeathEventHandler).inSingletonScope();
});
