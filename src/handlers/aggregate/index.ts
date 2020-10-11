import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import FacilityControlEvent from '../census/events/FacilityControlEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import GlobalClassAggregate from './global/GlobalClassAggregate';
import GlobalFacilityControlAggregate from './global/GlobalFacilityControlAggregate';
import GlobalFactionCombatAggregate from './global/GlobalFactionCombatAggregate';
import GlobalCharacterAggregate from './global/GlobalCharacterAggregate';
import GlobalWeaponAggregate from './global/GlobalWeaponAggregate';
import InstanceClassAggregate from './instance/InstanceClassAggregate';
import InstanceFacilityControlAggregate from './instance/InstanceFacilityControlAggregate';
import InstanceFactionCombatAggregate from './instance/InstanceFactionCombatAggregate';
import InstanceCharacterAggregate from './instance/InstanceCharacterAggregate';
import InstanceWeaponAggregate from './instance/InstanceWeaponAggregate';
import PopulationHandlerInterface from '../../interfaces/PopulationHandlerInterface';
import InstancePopulationAggregate from './instance/InstancePopulationAggregate';
import PopulationData from '../../data/PopulationData';
import InstanceOutfitAggregate from './instance/InstanceOutfitAggregate';
import GlobalOutfitAggregate from './global/GlobalOutfitAggregate';
import InstanceVehicleDestroyAggregate from './instance/InstanceVehicleDestroyAggregate';
import VehicleDestroyEvent from '../census/events/VehicleDestroyEvent';
import InstanceVehicleCharacterDeathAggregate from './instance/InstanceVehicleCharacterDeathAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handlers are registered here
    // Death Event
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalCharacterAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalOutfitAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalWeaponAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceCharacterAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceOutfitAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceWeaponAggregate).inSingletonScope();

    // FacilityControl Event
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(GlobalFacilityControlAggregate).inSingletonScope();
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(InstanceFacilityControlAggregate).inSingletonScope();

    // Population Event
    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationAggregates).to(InstancePopulationAggregate).inSingletonScope();

    // Vehicle Destroy Event
    bind<EventHandlerInterface<VehicleDestroyEvent>>(TYPES.vehicleDestroyAggregates).to(InstanceVehicleDestroyAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceVehicleCharacterDeathAggregate).inSingletonScope();
});
