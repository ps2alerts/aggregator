import {World} from '../constants/world';
import {CensusEnvironment} from '../types/CensusEnvironment';

export const getCensusEnvironment = (world: World): CensusEnvironment => {
    // Figure out environment
    switch (world) {
        case World.CONNERY:
        case World.MILLER:
        case World.COBALT:
        case World.EMERALD:
        case World.JAEGER:
        case World.SOLTECH:
            return 'ps2';
        case World.GENUDINE:
            return 'ps2ps4us';
        case World.CERES:
            return 'ps2ps4eu';
    }
};
