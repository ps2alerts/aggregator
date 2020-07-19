import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../../../src/interfaces/ServiceInterface';
import config from '../../../../src/config';
import TypeOrmConnection from './TypeOrmConnection';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(TypeOrmConnection);

    bind(TypeOrmConnection)
        .toDynamicValue(() => new TypeOrmConnection(
            config.database,
        ))
        .inSingletonScope();
});
