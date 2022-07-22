import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import {Death, FacilityControl, GainExperience, VehicleDestroy} from 'ps2census';
import DeathEventHandler from './DeathEventHandler';
import FacilityControlEventHandler from './FacilityControlEventHandler';
import GainExperienceEventHandler from './GainExperienceEventHandler';
import VehicleDestroyEventHandler from './VehicleDestroyEventHandler';

export default new ContainerModule((bind) => {
    bind<PS2EventQueueMessageHandlerInterface<Death>>(TYPES.eventInstanceHandlers).to(DeathEventHandler).inSingletonScope();
    bind<PS2EventQueueMessageHandlerInterface<FacilityControl>>(TYPES.eventInstanceHandlers).to(FacilityControlEventHandler).inSingletonScope();
    bind<PS2EventQueueMessageHandlerInterface<GainExperience>>(TYPES.eventInstanceHandlers).to(GainExperienceEventHandler).inSingletonScope();
    bind<PS2EventQueueMessageHandlerInterface<VehicleDestroy>>(TYPES.eventInstanceHandlers).to(VehicleDestroyEventHandler).inSingletonScope();
});
