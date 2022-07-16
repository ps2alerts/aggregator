import {Faction} from '../ps2alerts-constants/faction';
import IllegalArgumentException from '../exceptions/IllegalArgumentException';

export type FactionName = 'vs' | 'nc' | 'tr' | 'nso' | 'none';

export default class FactionUtils {
    public static parse(value: number): Faction {
        switch (value) {
            case Faction.NONE:
                return Faction.NONE;
            case Faction.NEW_CONGLOMERATE:
                return Faction.NEW_CONGLOMERATE;
            case Faction.NS_OPERATIVES:
                return Faction.NS_OPERATIVES;
            case Faction.TERRAN_REPUBLIC:
                return Faction.TERRAN_REPUBLIC;
            case Faction.VANU_SOVEREIGNTY:
                return Faction.VANU_SOVEREIGNTY;
        }

        throw new IllegalArgumentException(`Unknown faction: ${value}`, 'FactionUtils.parse');
    }

    public static parseFactionIdToShortName(value: Faction | null): FactionName {
        if (!value) {
            return 'none';
        }

        switch (value) {
            case Faction.VANU_SOVEREIGNTY:
                return 'vs';
            case Faction.NEW_CONGLOMERATE:
                return 'nc';
            case Faction.TERRAN_REPUBLIC:
                return 'tr';
            case Faction.NS_OPERATIVES:
                return 'nso';
        }

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new IllegalArgumentException(`Unable to parse faction numerical value to string: ${value}`, 'FactionUtils.parseFactionIdToShortName');
    }
}
