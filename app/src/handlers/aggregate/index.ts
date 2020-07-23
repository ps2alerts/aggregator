import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import FacilityControlEvent from '../census/events/FacilityControlEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import AlertFactionCombatAggregate from './alert/AlertFactionCombatAggregate';
import AlertWeaponAggregate from './alert/AlertWeaponAggregate';
import GlobalWeaponAggregate from './global/GlobalWeaponAggregate';
import AlertFacilityControlAggregate from './alert/AlertFacilityControlAggregate';
import WorldFacilityControlAggregate from './world/WorldFacilityControlAggregate';
import AlertPlayerAggregate from './alert/AlertPlayerAggregate';
import GlobalPlayerAggregate from './global/GlobalPlayerAggregate';
import GlobalFactionCombatAggregate from './global/GlobalFactionCombatAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handler

    // Death Event
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertPlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertWeaponAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalPlayerAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalWeaponAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(GlobalFactionCombatAggregate).inSingletonScope();

    // FacilityControl Event
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(AlertFacilityControlAggregate).inSingletonScope();
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(WorldFacilityControlAggregate).inSingletonScope();
});
