import IllegalArgumentException from '../exceptions/IllegalArgumentException';
import { Zone } from '../constants/zone';

export default class ZoneUtils {
    public static parse(value: number): Zone {
        switch (value) {
            case Zone.indar:
                return Zone.indar;
            case Zone.hossin:
                return Zone.hossin;
            case Zone.amerish:
                return Zone.amerish;
            case Zone.esamir:
                return Zone.esamir;
            case Zone.vrTrainingNC:
                return Zone.vrTrainingNC;
            case Zone.vrTrainingTR:
                return Zone.vrTrainingTR;
            case Zone.vrTrainingVS:
                return Zone.vrTrainingVS;
        }
        throw new IllegalArgumentException('Unknown zone: ' + value, 'ZoneUtils.parse');
    }
}
