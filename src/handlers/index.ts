import {ContainerModule} from 'inversify';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import CharacterPresenceHandler from './CharacterPresenceHandler';
import {TYPES} from '../constants/types';
import PopulationHandler from './PopulationHandler';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import PopulationData from '../data/PopulationData';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import CharacterBroker from './CharacterBroker';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import ItemBroker from './ItemBroker';
import {Context} from 'inversify/dts/planning/context';
import OutfitParticipantCacheHandler from './OutfitParticipantCacheHandler';
import FacilityDataBroker from './FacilityDataBroker';

export default new ContainerModule((bind) => {
    bind<CharacterPresenceHandlerInterface>(TYPES.characterPresenceHandler).to(CharacterPresenceHandler).inSingletonScope();

    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationHandler).to(PopulationHandler).inSingletonScope();

    bind<CharacterBrokerInterface>(TYPES.pcCharacterBrokerInterface).toDynamicValue(({container}: Context) =>
        new CharacterBroker(container.get(TYPES.pcWebsocketClient), container.get(TYPES.censusCharacterCacheDriver)));

    bind<CharacterBrokerInterface>(TYPES.ps2ps4euCharacterBrokerInterface).toDynamicValue(({container}: Context) =>
        new CharacterBroker(container.get(TYPES.ps2ps4euWebsocketClient), container.get(TYPES.censusCharacterCacheDriver)));

    bind<CharacterBrokerInterface>(TYPES.ps2ps4usCharacterBrokerInterface).toDynamicValue(({container}: Context) =>
        new CharacterBroker(container.get(TYPES.ps2ps4usWebsocketClient), container.get(TYPES.censusCharacterCacheDriver)));

    bind<ItemBrokerInterface>(TYPES.itemBrokerInterface).to(ItemBroker).inSingletonScope();
    bind<FacilityDataBroker>(TYPES.facilityDataBrokerInterface).to(FacilityDataBroker).inSingletonScope();
    bind<OutfitParticipantCacheHandler>(TYPES.outfitParticipantCacheHandler).to(OutfitParticipantCacheHandler).inSingletonScope();
});
