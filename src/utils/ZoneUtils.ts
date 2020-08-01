import IllegalArgumentException from '../exceptions/IllegalArgumentException';
import {Zone} from '../constants/zone';

export default class ZoneUtils {
    public static parse(value: number): Zone {
        switch (value) {
            case Zone.INDAR:
                return Zone.INDAR;
            case Zone.HOSSIN:
                return Zone.HOSSIN;
            case Zone.AMERISH:
                return Zone.AMERISH;
            case Zone.ESAMIR:
                return Zone.ESAMIR;
            default:
                throw new IllegalArgumentException(`Unknown zone: ${value}`, 'ZoneUtils.parse');
        }
    }
}
