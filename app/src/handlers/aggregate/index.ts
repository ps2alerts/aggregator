import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import FacilityControlEvent from '../census/events/FacilityControlEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import AlertFactionCombatAggregate from './alert/AlertFactionCombatAggregate';
import AlertFacilityControlAggregate from './alert/AlertFacilityControlAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handlers
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<FacilityControlEvent>>(TYPES.facilityControlAggregates).to(AlertFacilityControlAggregate).inSingletonScope();
});
