import {ContainerModule} from 'inversify';
import {TYPES} from '../../constants/types';
import {PS2EventInstanceHandlerContract} from '../../interfaces/PS2EventInstanceHandlerContract';
import {Death, FacilityControl, GainExperience, VehicleDestroy} from 'ps2census';
import DeathEventHandler from './DeathEventHandler';
import FacilityControlEventHandler from './FacilityControlEventHandler';
import GainExperienceEventHandler from './GainExperienceEventHandler';
import VehicleDestroyEventHandler from './VehicleDestroyEventHandler';

export default new ContainerModule((bind) => {
    bind<PS2EventInstanceHandlerContract<Death>>(TYPES.eventInstanceHandlers).to(DeathEventHandler).inSingletonScope();
    bind<PS2EventInstanceHandlerContract<FacilityControl>>(TYPES.eventInstanceHandlers).to(FacilityControlEventHandler).inSingletonScope();
    bind<PS2EventInstanceHandlerContract<GainExperience>>(TYPES.eventInstanceHandlers).to(GainExperienceEventHandler).inSingletonScope();
    bind<PS2EventInstanceHandlerContract<VehicleDestroy>>(TYPES.eventInstanceHandlers).to(VehicleDestroyEventHandler).inSingletonScope();
});
