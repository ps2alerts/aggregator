import {Faction} from '../constants/faction';
import IllegalArgumentException from '../exceptions/IllegalArgumentException';

export default class FactionUtils {
    public static parse(value: number): Faction {
        switch (value) {
            case Faction.none:
                return  Faction.none;
            case Faction.newConglomerate:
                return Faction.newConglomerate;
            case Faction.nSOperatives:
                return Faction.nSOperatives;
            case Faction.terranRepublic:
                return Faction.terranRepublic;
            case Faction.vanuSovereignty:
                return Faction.vanuSovereignty;
        }
        throw new IllegalArgumentException('Unknown faction: ' + value);
    }
}
