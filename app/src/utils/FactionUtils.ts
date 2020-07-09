import {Faction} from '../constants/faction';
import IllegalArgumentException from '../exceptions/IllegalArgumentException';

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

        throw new IllegalArgumentException(`Unknown faction: ${value}`);
    }
}
