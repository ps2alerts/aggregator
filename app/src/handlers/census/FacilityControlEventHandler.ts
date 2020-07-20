import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import FacilityControlEvent from './events/FacilityControlEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('FacilityControlEventHandler');

    public async handle(event: PS2Event): Promise<boolean>{
        FacilityControlEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const facilityControl = new FacilityControlEvent(event);
            await this.storeEvent(facilityControl);
        } catch (e) {
            if (e instanceof Error) {
                FacilityControlEventHandler.logger.warn(`Error parsing FacilityControlEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                FacilityControlEventHandler.logger.error('UNEXPECTED ERROR parsing FacilityControlEvent!');
            }

            return false;
        }

        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(facilityControlEvent: FacilityControlEvent): Promise<boolean> {
        return true;
        // TODO Store in database
    }
}
