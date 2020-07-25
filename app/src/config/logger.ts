import {get} from '../utils/env';

export default class Logger {
    public readonly level = get('LOG_LEVEL', get('NODE_ENV', 'development') === 'development' ? 'debug' : 'info');

    public readonly logsEnabled = {
        validationRejects: true,
        censusIncomingEvents: true,
        censusEventContent: {
            achievementEarned: false,
            battleRankUp: false,
            continentLock: false,
            continentUnlock: false,
            death: false,
            facilityControl: true,
            gainExperience: false,
            metagameEvent: true,
            playerPresence: false,
            playerFacility: true,
        },
        aggregates: {
            global: {
                class: false,
                factionCombat: false,
                player: false,
                weapon: false,
                vehicle: false,
            },
            instance: {
                class: false,
                facilityControl: true,
                factionCombat: false,
                player: false,
                weapon: false,
            },
            world: {
                facilityControl: true,
            },
        },
    };
}
