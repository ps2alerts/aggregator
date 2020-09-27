import {Module} from '@nestjs/common';
import {MockInstanceController} from './controllers/mockinstance.controller';
import {DeathProcessor} from './processors/death.processor';
import {CensusModule} from 'ps2census-nestjs';
import {ClientModule} from './services/client.module';

@Module({
    imports: [
        ClientModule,
        CensusModule,
    ],
    controllers: [
        MockInstanceController,
    ],
    providers: [
        DeathProcessor,
    ],
})
export class AppModule {
}
