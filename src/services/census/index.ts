import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import {Client} from 'ps2census';
import Census from '../../config/census';
import CensusCacheDriver from '../../drivers/CensusCacheDriver';
import {TYPES} from '../../constants/types';
import {RedisConnection} from '../redis/RedisConnection';
import CensusStreamService from './CensusStreamService';
import CensusStreamServiceFactory from '../../factories/CensusStreamServiceFactory';
import CensusStream from './CensusStream';
import CensusEventSubscriber from './CensusEventSubscriber';
import CensusEventSubscriberFactory from '../../factories/CensusEventSubscriberFactory';

export default new ContainerModule((bind) => {
    bind<Census>(TYPES.censusConfig).toConstantValue(config.census);

    // Boot the Census Stream services
    bind<ServiceInterface>(SERVICE).to(CensusStreamService).inSingletonScope();

    // Driver
    bind<CensusCacheDriver>(TYPES.censusCharacterCacheDriver)
        .toDynamicValue(({container}) => new CensusCacheDriver(
            'character',
            86400,
            container.get(RedisConnection),
        )).inSingletonScope();

    // Websocket Clients
    bind<Client>(TYPES.pcWebsocketClient)
        .toDynamicValue(({container}) => {
            const clientConfig = {...config.census.pcClientConfig};

            clientConfig.characterManager = {
                ...clientConfig.characterManager,
                cache: container.get(TYPES.censusCharacterCacheDriver),
            };

            return new Client(config.census.serviceID, clientConfig);
        }).inSingletonScope();

    bind<Client>(TYPES.ps2ps4euWebsocketClient)
        .toDynamicValue(({container}) => {
            const clientConfig = {...config.census.ps2ps4euClientConfig};

            clientConfig.characterManager = {
                ...clientConfig.characterManager,
                cache: container.get(TYPES.censusCharacterCacheDriver),
            };

            return new Client(config.census.serviceID, clientConfig);
        }).inSingletonScope();

    bind<Client>(TYPES.ps2ps4usWebsocketClient)
        .toDynamicValue(({container}) => {
            const clientConfig = {...config.census.ps2ps4usClientConfig};

            clientConfig.characterManager = {
                ...clientConfig.characterManager,
                cache: container.get(TYPES.censusCharacterCacheDriver),
            };

            return new Client(config.census.serviceID, clientConfig);
        }).inSingletonScope();

    bind<CensusStream>(TYPES.censusStreamServices)
        .toDynamicValue(({container}) => {
            const factory: CensusStreamServiceFactory = container.get(TYPES.censusStreamServiceFactory);
            return factory.build(
                container.get(TYPES.pcWebsocketClient),
                'ps2',
                container.get(TYPES.pcCensusEventSubscriberService),
                container.get(TYPES.pcCensusStaleConnectionWatcherAuthority),
            );
        }).inSingletonScope();

    bind<CensusStream>(TYPES.censusStreamServices)
        .toDynamicValue(({container}) => {
            const factory: CensusStreamServiceFactory = container.get(TYPES.censusStreamServiceFactory);
            return factory.build(
                container.get(TYPES.ps2ps4euWebsocketClient),
                'ps2ps4eu',
                container.get(TYPES.ps2ps4euCensusEventSubscriberService),
                container.get(TYPES.ps2ps4euCensusStaleConnectionWatcherAuthority),
            );
        }).inSingletonScope();

    bind<CensusStream>(TYPES.censusStreamServices)
        .toDynamicValue(({container}) => {
            const factory: CensusStreamServiceFactory = container.get(TYPES.censusStreamServiceFactory);
            return factory.build(
                container.get(TYPES.ps2ps4usWebsocketClient),
                'ps2ps4us',
                container.get(TYPES.ps2ps4usCensusEventSubscriberService),
                container.get(TYPES.ps2ps4usCensusStaleConnectionWatcherAuthority),
            );
        }).inSingletonScope();

    bind<CensusEventSubscriber>(TYPES.pcCensusEventSubscriberService)
        .toDynamicValue(({container}) => {
            const factory: CensusEventSubscriberFactory = container.get(TYPES.censusEventSubscriberFactory);
            return factory.build(
                container.get(TYPES.pcWebsocketClient),
                'ps2',
                container.get(TYPES.pcCharacterBrokerInterface),
            );
        }).inSingletonScope();

    bind<CensusEventSubscriber>(TYPES.ps2ps4euCensusEventSubscriberService)
        .toDynamicValue(({container}) => {
            const factory: CensusEventSubscriberFactory = container.get(TYPES.censusEventSubscriberFactory);
            return factory.build(
                container.get(TYPES.ps2ps4euWebsocketClient),
                'ps2ps4eu',
                container.get(TYPES.ps2ps4euCharacterBrokerInterface),
            );
        }).inSingletonScope();

    bind<CensusEventSubscriber>(TYPES.ps2ps4usCensusEventSubscriberService)
        .toDynamicValue(({container}) => {
            const factory: CensusEventSubscriberFactory = container.get(TYPES.censusEventSubscriberFactory);
            return factory.build(
                container.get(TYPES.ps2ps4usWebsocketClient),
                'ps2ps4us',
                container.get(TYPES.ps2ps4usCharacterBrokerInterface),
            );
        }).inSingletonScope();
});
