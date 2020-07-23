import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import FacilityControlEvent from '../census/events/FacilityControlEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import AlertClassAggregate from './alert/AlertClassAggregate';
import AlertFacilityControlAggregate from './alert/AlertFacilityControlAggregate';
import AlertFactionCombatAggregate from './alert/AlertFactionCombatAggregate';
import AlertPlayerAggregate from './alert/AlertPlayerAggregate';
import AlertWeaponAggregate from './alert/AlertWeaponAggregate';
import GlobalClassAggregate from './global/GlobalClassAggregate';
import GlobalPlayerAggregate from './global/GlobalPlayerAggregate';
import GlobalFactionCombatAggregate from './global/GlobalFactionCombatAggregate';
import GlobalWeaponAggregate from './global/GlobalWeaponAggregate';
import WorldFacilityControlAggregate from './world/WorldFacilityControlAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handlers are registered here
    // Death Event
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertPlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertWeaponAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalClassAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalPlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalWeaponAggregate).inSingletonScope();

    // FacilityControl Event
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(AlertFacilityControlAggregate).inSingletonScope();
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(WorldFacilityControlAggregate).inSingletonScope();
});
