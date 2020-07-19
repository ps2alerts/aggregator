import {Zone} from '../constants/zone';

export default class EventId {
    public static eventIdToZoneId(eventId: number): number {
        switch (eventId) {
            case 1: // Territory Control
                return Zone.INDAR;
            case 2: // Territory Control
                return Zone.AMERISH;
            case 3: // Territory Control
                return Zone.ESAMIR;
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
            // No 15 in the API
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
            case 147: // Indar Territory Control
            case 148:
                return Zone.INDAR;
            case 150: // Esamir Territory Control
            case 151:
            case 152:
                return Zone.ESAMIR;
            case 153: // Hossin Territory Control
            case 154:
                return Zone.HOSSIN;
            case 156: // Amerish Territoryt Control
            case 157:
            case 158:
                return Zone.AMERISH;
            case 159: // Amerish Warpgates Stabilizing
                return Zone.AMERISH;
            case 160: // Esamir Warpgates Stabilizing
                return Zone.ESAMIR;
            case 161: // Indar Warpgates Stabilizing
                return Zone.INDAR;
            case 162: // Hossin Warpgates Stabilizing
                return Zone.HOSSIN;
            case 164: // Tech Plant Control
                return Zone.ESAMIR;
            case 167: // Aerial Anomalies
            case 168: // Eye of the Storm
            case 170: // THE BENDING?! OwO
            case 172: // Aerial Anomalies
            case 173: // Aerial Anomalies
            case 174: // Aerial Anomalies
            case 175: // Race for Readings
                return -1;
            case 176: // Esamir Unstable Meltdown
                return Zone.ESAMIR;
            case 177: // Hossin Unstable Meltdown
                return Zone.HOSSIN;
            case 178: // Amerish Unstable Meltdown
                return Zone.AMERISH;
            case 179: // Indar Unstable Meltdown
                return Zone.INDAR;
            case 180: // Large Outposts "Gaining Ground"
            case 181: // Large Outposts "Gaining Ground"
            case 182: // Large Outposts "Gaining Ground"
            case 183: // Large Outposts "Gaining Ground"
                return -1;
            case 186: // Esamir Unstable Meltdown
                return Zone.ESAMIR;
            case 187: // Hossin Unstable Meltdown
                return Zone.HOSSIN;
            case 188: // Amerish Unstable Meltdown
                return Zone.AMERISH;
            case 189: // Indar Unstable Meltdown
                return Zone.INDAR;
            case 190: // Esamir Unstable Meltdown
                return Zone.ESAMIR;
            case 191: // Hossin Unstable Meltdown
                return Zone.HOSSIN;
            case 192: // Amerish Unstable Meltdown
                return Zone.AMERISH;
            case 193: // Indar Unstable Metldown
                return Zone.INDAR;
            case 194: // Refine and refuel
            case 195:
            case 196:
            case 197:
                return -1;
            case 198: // "Maximum Pressure" aka Kill everyone
            case 199:
            case 200:
            case 201:
                return -1;
            case 204: // Outfit wars!
            case 205: // Outfit wars pre-match
            case 206: // Outfit wars relics changing
            case 207: // Outfit wars BEGIN (750 points)
                return Zone.DESOLATION;
            case 209: // Koltyr Territory Control
            case 210:
                return Zone.KOLTYR;
        }

        return -1;
    }
}
