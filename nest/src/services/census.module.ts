import {CensusModule} from 'ps2census-nestjs';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {rest} from 'ps2census';

export default CensusModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigModule],
    useFactory: (config: ConfigService) => ({
        serviceID: config.get('census.serviceID'),
        environment: 'ps2',
        streamManagerConfig: {
            subscription: {
                eventNames: ['Death', 'FacilityControl', 'MetagameEvent', 'PlayerLogin', 'PlayerLogout', 'GainExperience'],
                worlds: config.get('census.worlds'),
                characters: ['all'],
                logicalAndCharactersWithWorlds: true,
            },
        },
        characterManager: {
            request: rest.resolve(
                rest.hide(rest.character, ['head_id', 'times', 'certs', 'profile_id', 'title_id', 'daily_ribbon']),
                [
                    'world',
                    ['outfit_member_extended', ['outfit_id', 'name', 'alias', 'leader_character_id']],
                ],
            ),
        },
    }),
})
