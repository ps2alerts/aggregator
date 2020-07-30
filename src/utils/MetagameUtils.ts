import {MetagameEventIds} from '../constants/metagameEventIds';

export default class MetagameUtils {
    public static getMetagameDuration(metagameId: MetagameEventIds): number {
        switch (metagameId) {
            case MetagameEventIds.MELTDOWN_AMERISH:
            case MetagameEventIds.MELTDOWN_ESAMIR:
            case MetagameEventIds.MELTDOWN_HOSSIN:
            case MetagameEventIds.MELTDOWN_INDAR:
                return 60 * 90; // 3600 seconds
            case MetagameEventIds.MELTDOWN_UNSTABLE_AMERISH:
            case MetagameEventIds.MELTDOWN_UNSTABLE_ESAMIR:
            case MetagameEventIds.MELTDOWN_UNSTABLE_HOSSIN:
            case MetagameEventIds.MELTDOWN_UNSTABLE_INDAR:
                return 60 * 45; // 1800 seconds
        }
    }
}
