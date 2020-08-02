import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import FacilityControlEvent from '../census/events/FacilityControlEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import GlobalClassAggregate from './global/GlobalClassAggregate';
import GlobalFacilityControlAggregate from './global/GlobalFacilityControlAggregate';
import GlobalFactionCombatAggregate from './global/GlobalFactionCombatAggregate';
import GlobalPlayerAggregate from './global/GlobalPlayerAggregate';
import GlobalWeaponAggregate from './global/GlobalWeaponAggregate';
import InstanceClassAggregate from './instance/InstanceClassAggregate';
import InstanceFacilityControlAggregate from './instance/InstanceFacilityControlAggregate';
import InstanceFactionCombatAggregate from './instance/InstanceFactionCombatAggregate';
import InstancePlayerAggregate from './instance/InstancePlayerAggregate';
import InstanceWeaponAggregate from './instance/InstanceWeaponAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handlers are registered here
    // Death Event
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalPlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalWeaponAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstancePlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(InstanceWeaponAggregate).inSingletonScope();

    // FacilityControl Event
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(GlobalFacilityControlAggregate).inSingletonScope();
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(InstanceFacilityControlAggregate).inSingletonScope();
});
