import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import TypeOrmConnection from './TypeOrmConnection';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(TypeOrmConnection);

    bind(TypeOrmConnection)
        .toDynamicValue(() => new TypeOrmConnection(
            config.database,
        ))
        .inSingletonScope();
});
