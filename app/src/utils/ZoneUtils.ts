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
            case Zone.VR_TRAINING_NC:
                return Zone.VR_TRAINING_NC;
            case Zone.VR_TRAINING_TR:
                return Zone.VR_TRAINING_TR;
            case Zone.VR_TRAINING_VS:
                return Zone.VR_TRAINING_VS;
            default:
                throw new IllegalArgumentException(`Unknown zone: ${value}`, 'ZoneUtils.parse');
        }
    }
}
