import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import TypeOrmService from './TypeOrmService';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(TypeOrmService);

    bind(TypeOrmService)
        .toDynamicValue(() => new TypeOrmService(
            config.database,
        ))
        .inSingletonScope();
});
