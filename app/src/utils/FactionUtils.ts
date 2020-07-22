import {Faction} from '../constants/faction';
import IllegalArgumentException from '../exceptions/IllegalArgumentException';
import {Loadout} from '../constants/loadout';

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

    public static parseFactionFromClass(classId: number): Faction {
        switch (classId) {
            case Loadout.NC_INFILTRATOR:
            case Loadout.NC_LIGHT_ASSAULT:
            case Loadout.NC_MEDIC:
            case Loadout.NC_ENGINEER:
            case Loadout.NC_HEAVY_ASSAULT:
            case Loadout.NC_MAX:
                return Faction.NEW_CONGLOMERATE;
            case Loadout.TR_INFILTRATOR:
            case Loadout.TR_LIGHT_ASSAULT:
            case Loadout.TR_MEDIC:
            case Loadout.TR_ENGINEER:
            case Loadout.TR_HEAVY_ASSAULT:
            case Loadout.TR_MAX:
                return Faction.TERRAN_REPUBLIC;
            case Loadout.VS_INFILTRATOR:
            case Loadout.VS_LIGHT_ASSAULT:
            case Loadout.VS_MEDIC:
            case Loadout.VS_ENGINEER:
            case Loadout.VS_HEAVY_ASSAULT:
            case Loadout.VS_MAX:
                return Faction.VANU_SOVEREIGNTY;
            case Loadout.NSO_INFILTRATOR:
            case Loadout.NSO_LIGHT_ASSAULT:
            case Loadout.NSO_MEDIC:
            case Loadout.NSO_ENGINEER:
            case Loadout.NSO_HEAVY_ASSAULT:
            case Loadout.NSO_MAX:
                return Faction.NS_OPERATIVES;
        }

        throw new IllegalArgumentException(`Could not parse Class ID to faction: ${classId}`, 'FactionUtils.parseFactionFromClass');
    }

    public static parseFactionIdToShortName(value: Faction): string {
        switch (value) {
            case Faction.VANU_SOVEREIGNTY:
                return 'vs';
            case Faction.NEW_CONGLOMERATE:
                return 'nc';
            case Faction.TERRAN_REPUBLIC:
                return 'tr';
            case Faction.NS_OPERATIVES:
                return 'nso';
            case Faction.NONE:
                return 'none';
        }

        throw new IllegalArgumentException(`Unable to parse faction numerical value to string: ${value}`, 'FactionUtils.parseFactionIdToShortName');
    }
}
