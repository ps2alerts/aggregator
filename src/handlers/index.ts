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

export default new ContainerModule((bind) => {
    bind<CharacterPresenceHandlerInterface>(TYPES.characterPresenceHandler).to(CharacterPresenceHandler).inSingletonScope();

    bind<PopulationHandlerInterface<PopulationData>>(TYPES.populationHandler).to(PopulationHandler).inSingletonScope();

    bind<CharacterBrokerInterface>(TYPES.pcCharacterBrokerInterface).toDynamicValue(({container}: Context) => {
        return new CharacterBroker(container.get(TYPES.pcWebsocketClient));
    });

    bind<CharacterBrokerInterface>(TYPES.ps2ps4euCharacterBrokerInterface).toDynamicValue(({container}: Context) => {
        return new CharacterBroker(container.get(TYPES.ps2ps4euWebsocketClient));
    });

    bind<CharacterBrokerInterface>(TYPES.ps2ps4usCharacterBrokerInterface).toDynamicValue(({container}: Context) => {
        return new CharacterBroker(container.get(TYPES.ps2ps4usWebsocketClient));
    });

    bind<ItemBrokerInterface>(TYPES.itemBrokerInterface).to(ItemBroker).inSingletonScope();
    bind<OutfitParticipantCacheHandler>(TYPES.outfitParticipantCacheHandler).to(OutfitParticipantCacheHandler).inSingletonScope();
});
