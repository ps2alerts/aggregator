import {ContainerModule} from 'inversify';
import {TYPES} from '../constants/types';
import InstanceActionFactory from './InstanceActionFactory';
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';
import {Context} from 'inversify/dts/planning/context';
import BracketCalculatorFactory from './BracketCalculatorFactory';
import CensusStreamServiceFactory from './CensusStreamServiceFactory';
import MetagameEventEventHandler from '../handlers/census/MetagameEventEventHandler';
import FacilityControlEventHandler from '../handlers/census/FacilityControlEventHandler';
import GainExperienceEventHandler from '../handlers/census/GainExperienceEventHandler';
import VehicleDestroyEventHandler from '../handlers/census/VehicleDestroyEventHandler';
import CensusEventSubscriberFactory from './CensusEventSubscriberFactory';
import DeathEventHandler from '../handlers/census/DeathEventHandler';

export default new ContainerModule((bind) => {
    bind<InstanceActionFactory>(TYPES.instanceActionFactory).to(InstanceActionFactory).inSingletonScope();

    bind<TerritoryCalculatorFactory>(TYPES.territoryCalculatorFactory).toDynamicValue(({container}: Context) => new TerritoryCalculatorFactory(
        container.get(TYPES.instanceFacilityControlModelFactory),
        container.get(TYPES.censusConfig),
    )).inSingletonScope();

    bind<BracketCalculatorFactory>(TYPES.bracketCalculatorFactory).to(BracketCalculatorFactory).inSingletonScope();

    bind<CensusStreamServiceFactory>(TYPES.censusStreamServiceFactory).toDynamicValue(({container}: Context) => new CensusStreamServiceFactory(
        container.get(TYPES.characterPresenceHandler),
    ));

    bind<CensusEventSubscriberFactory>(TYPES.censusEventSubscriberFactory).toDynamicValue(({container}: Context) => new CensusEventSubscriberFactory(
        container.get(DeathEventHandler),
        container.get(MetagameEventEventHandler),
        container.get(FacilityControlEventHandler),
        container.get(GainExperienceEventHandler),
        container.get(VehicleDestroyEventHandler),
        container.get(TYPES.instanceAuthority),
        container.get(TYPES.characterPresenceHandler),
        container.get(TYPES.itemBrokerInterface),
        container.get(TYPES.facilityDataBrokerInterface),
    ));
});
