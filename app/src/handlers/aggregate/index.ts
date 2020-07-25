import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import FacilityControlEvent from '../census/events/FacilityControlEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import InstanceClassAggregate from './instance/InstanceClassAggregate';
import InstanceFacilityControlAggregate from './instance/InstanceFacilityControlAggregate';
import InstanceFactionCombatAggregate from './instance/InstanceFactionCombatAggregate';
import InstancePlayerAggregate from './instance/InstancePlayerAggregate';
import InstanceWeaponAggregate from './instance/InstanceWeaponAggregate';
import GlobalClassAggregate from './global/GlobalClassAggregate';
import GlobalPlayerAggregate from './global/GlobalPlayerAggregate';
import GlobalFactionCombatAggregate from './global/GlobalFactionCombatAggregate';
import GlobalWeaponAggregate from './global/GlobalWeaponAggregate';
import WorldFacilityControlAggregate from './world/WorldFacilityControlAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handlers are registered here
    // Death Event
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstancePlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceWeaponAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalPlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalWeaponAggregate).inSingletonScope();

    // FacilityControl Event
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(InstanceFacilityControlAggregate).inSingletonScope();
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(WorldFacilityControlAggregate).inSingletonScope();
});
