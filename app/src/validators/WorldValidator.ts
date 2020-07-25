import config from '../config';
import {injectable} from 'inversify';
import {getLogger, getLogsEnabled} from '../logger';

@injectable()
export default class WorldValidator {
    private static readonly logger = getLogger('WorldValidator');

    public validate(world: number): boolean {
        if (!config.features.monitoredServers.has(world)) {
            if (getLogsEnabled().validationRejects) {
                WorldValidator.logger.warn(`Got event from world ${world}, which we don't monitor!`);
            }

            return false;
        }

        return true;
    }
}
