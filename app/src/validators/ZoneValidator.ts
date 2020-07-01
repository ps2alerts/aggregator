import config from '../config';
import { injectable } from 'inversify';
import { getLogger } from '../logger';

@injectable()
export default class ZoneValidator {
    private static readonly logger = getLogger('ZoneValidator');

    public validate(zone: number): boolean {
        if (!config.features.monitoredZones.has(zone)) {
            if (config.features.logging.validationRejects) {
                ZoneValidator.logger.warn(`Got event from zone ${zone}, which we don't monitor!`);
            }
            return false;
        }

        return true;
        // TODO: Perform checks for active alert worlds
    }
}
