import {Zone} from '../constants/zone';
import {Faction} from '../constants/faction';
import {MetagameEventType} from '../constants/metagameEventType';

export default class EventId {
    // FML
    private static readonly normalStateZoneFactionMap: Map<Zone, Map<Faction, MetagameEventType>> = new Map<Zone, Map<Faction, MetagameEventType>>(
        [
            [Zone.INDAR, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.INDAR_ENLIGHTENMENT],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.INDAR_LIBERATION],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.INDAR_SUPERIORITY],
                ],
            )],
            [Zone.HOSSIN, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.HOSSIN_ENLIGHTENMENT],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.HOSSIN_LIBERATION],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.HOSSIN_SUPERIORITY],
                ],
            )],
            [Zone.AMERISH, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.AMERISH_ENLIGHTENMENT],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.AMERISH_LIBERATION],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.AMERISH_SUPERIORITY],
                ],
            )],
            [Zone.ESAMIR, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.ESAMIR_ENLIGHTENMENT],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.ESAMIR_LIBERATION],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.ESAMIR_SUPERIORITY],
                ],
            )],
            [Zone.OSHUR, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.OSHUR_ENGLIGHTENMENT],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.OSHUR_LIBERATION],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.OSHUR_SUPERIORITY],
                ],
            )],
        ],
    );

    private static readonly unstableMeltdownZoneFactionMap: Map<Zone, Map<Faction, MetagameEventType>> = new Map<Zone, Map<Faction, MetagameEventType>>(
        [
            [Zone.INDAR, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.VS_INDAR_UNSTABLE_MELTDOWN],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.NC_INDAR_UNSTABLE_MELTDOWN],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.TR_INDAR_UNSTABLE_MELTDOWN],
                ],
            )],
            [Zone.HOSSIN, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.VS_HOSSIN_UNSTABLE_MELTDOWN],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.NC_HOSSIN_UNSTABLE_MELTDOWN],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.TR_HOSSIN_UNSTABLE_MELTDOWN],
                ],
            )],
            [Zone.AMERISH, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.VS_AMERISH_UNSTABLE_MELTDOWN],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.NC_AMERISH_UNSTABLE_MELTDOWN],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.TR_AMERISH_UNSTABLE_MELTDOWN],
                ],
            )],
            [Zone.ESAMIR, new Map(
                [
                    [Faction.VANU_SOVEREIGNTY, MetagameEventType.VS_ESAMIR_UNSTABLE_MELTDOWN],
                    [Faction.NEW_CONGLOMERATE, MetagameEventType.NC_ESAMIR_UNSTABLE_MELTDOWN],
                    [Faction.TERRAN_REPUBLIC, MetagameEventType.TR_ESAMIR_UNSTABLE_MELTDOWN],
                ],
            )],
            [Zone.OSHUR, new Map(
                [
                    // We don't know these yet :-/
                ],
            )],
        ],
    );

    public static eventIdToZoneId(eventId: number): number {
        switch (eventId) {
            case 1: // Territory Control
                return Zone.INDAR;
            case 2: // Territory Control
                return Zone.ESAMIR;
            case 3: // Territory Control
                return Zone.AMERISH;
            case 4: // Territory Control
                return Zone.HOSSIN;
            case 7: // Biolab Control
                return Zone.AMERISH;
            case 8: // Tech Plant Control
                return Zone.AMERISH;
            case 9: // Amp Station Control
                return Zone.AMERISH;
            case 10: // Biolab Control
                return Zone.INDAR;
            case 11: // Tech Plant Control
                return Zone.INDAR;
            case 12: // Amp Station Control
                return Zone.INDAR;
            case 13: // Biolab Control
                return Zone.ESAMIR;
            case 14: // Amp Station Control
                return Zone.ESAMIR;
            // No 15 in the API, only one tech plant on Esamir presumably
            case 16: // Biolab Control
                return Zone.HOSSIN;
            case 17: // Tech Plant Control
                return Zone.HOSSIN;
            case 18: // Amp Station Control
                return Zone.HOSSIN;
            case 106: // Capture bases & Kills, unknown zone
                return -1;
            case 123: // Indar Territory Control
            case 124:
            case 125:
                return Zone.INDAR;
            case 126: // Esamir Territory Control
            case 127:
            case 128:
                return Zone.ESAMIR;
            case 129: // Hossin Territory Control
            case 130:
            case 131:
                return Zone.HOSSIN;
            case 132: // Amerish Territory Control
            case 133:
            case 134:
                return Zone.AMERISH;
            case 147: // Indar TR Territory Control (ACTIVE)
            case 148: // Indar VS Territory Control (ACTIVE)
            case 149: // Indar NC Territory Control (ACTIVE)
                return Zone.INDAR;
            case 150: // Esamir TR Territory Control (ACTIVE)
            case 151: // Esamir VS Territory Control (ACTIVE)
            case 152: // Esamir NC Territory Control (ACTIVE)
                return Zone.ESAMIR;
            case 153: // Hossin TR Territory Control (ACTIVE)
            case 154: // Hossin VS Territory Control (ACTIVE)
            case 155: // Hossin NC Territory Control (ACTIVE)
                return Zone.HOSSIN;
            case 156: // Amerish TR Territory Control (ACTIVE)
            case 157: // Amerish NC Territory Control (ACTIVE)
            case 158: // Amerish NC Territory Control (ACTIVE)
                return Zone.AMERISH;
            case 159: // Amerish Warpgates Stabilizing
                return Zone.AMERISH;
            case 160: // Esamir Warpgates Stabilizing
                return Zone.ESAMIR;
            case 161: // Indar Warpgates Stabilizing
                return Zone.INDAR;
            case 162: // Hossin Warpgates Stabilizing
                return Zone.HOSSIN;
            case 164: // Tech Plant Control... wut
                return Zone.ESAMIR;
            case 167: // Aerial Anomalies
            case 168: // Eye of the Storm
            case 170: // THE BENDING?! OwO
            case 172: // Aerial Anomalies
            case 173: // Aerial Anomalies
            case 174: // Aerial Anomalies
            case 175: // Race for Readings
                return -1;
            case 176: // Esamir Unstable Meltdown NC TRIGGER??? (ACTIVE)
                return Zone.ESAMIR;
            case 177: // Hossin Unstable Meltdown NC TRIGGER??? (ACTIVE)
                return Zone.HOSSIN;
            case 178: // Amerish Unstable Meltdown NC TRIGGER??? (ACTIVE)
                return Zone.AMERISH;
            case 179: // Indar Unstable Meltdown NC TRIGGER??? (ACTIVE)
                return Zone.INDAR;
            case 180: // Large Outposts "Gaining Ground"
            case 181: // Large Outposts "Gaining Ground"
            case 182: // Large Outposts "Gaining Ground"
            case 183: // Large Outposts "Gaining Ground"
                return -1;
            case 186: // Esamir Unstable Meltdown VS TRIGGER??? (ACTIVE)
                return Zone.ESAMIR;
            case 187: // Hossin Unstable Meltdown VS TRIGGER??? (ACTIVE)
                return Zone.HOSSIN;
            case 188: // Amerish Unstable Meltdown VS TRIGGER??? (ACTIVE)
                return Zone.AMERISH;
            case 189: // Indar Unstable Meltdown VS TRIGGER???(ACTIVE)
                return Zone.INDAR;
            case 190: // Esamir Unstable Meltdown TR TRIGGER??? (ACTIVE)
                return Zone.ESAMIR;
            case 191: // Hossin Unstable Meltdown TR TRIGGER??? (ACTIVE)
                return Zone.HOSSIN;
            case 192: // Amerish Unstable Meltdown TR TRIGGER??? (ACTIVE)
                return Zone.AMERISH;
            case 193: // Indar Unstable Meltdown TR TRIGGER??? (ACTIVE)
                return Zone.INDAR;
            case 194: // Refine and refuel
            case 195: // Refine and refuel
            case 196: // Refine and refuel
            case 197: // Refine and refuel
                return -1;
            case 198: // "Maximum Pressure" aka Kill everyone
            case 199: // "Maximum Pressure" aka Kill everyone
            case 200: // "Maximum Pressure" aka Kill everyone
            case 201: // "Maximum Pressure" aka Kill everyone
                return -1;
            case 204: // Outfit wars begin (500 points)
            case 205: // Outfit wars pre-match
            case 206: // Outfit wars relics changing
            case 207: // Outfit wars begin (750 points)
            case 208: // Koltyr Territory Control NC Triggered (ACTIVE - BUT WE DON'T TRACK)
            case 209: // Koltyr Territory Control TR Triggered (ACTIVE - BUT WE DON'T TRACK)
            case 210: // Koltyr Territory Control VS Triggered (ACTIVE - BUT WE DON'T TRACK)
                // return Zone.KOLTYR OR Zone.DESOLATION
                return -1;
            case 222: // Oshur NC Triggered
            case 223: // Oshur TR Triggered
            case 224: // Oshur VS Triggered
                return Zone.OSHUR;
        }

        return -1;
    }

    public static zoneFactionMeltdownToEventId(zone: Zone, faction: Faction, meltdown: boolean): MetagameEventType {
        if (!meltdown) {

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return EventId.normalStateZoneFactionMap.get(zone).get(faction);
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return EventId.unstableMeltdownZoneFactionMap.get(zone).get(faction);
    }
}
