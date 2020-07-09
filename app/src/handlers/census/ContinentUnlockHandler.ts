import { injectable } from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { getLogger } from '../../logger';
import config from '../../config';
import { jsonLogOutput } from '../../utils/json';
import ContinentUnlockEvent from './events/ContinentUnlockEvent';


@injectable()
export default class ContinentUnlockHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('ContinentUnlockHandler');

    public handle(event: GenericEvent): boolean {
        ContinentUnlockHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            ContinentUnlockHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        try {
            const continentUnlockEvent = new ContinentUnlockEvent(event);
            this.storeEvent(continentUnlockEvent);
        } catch (e) {
            ContinentUnlockHandler.logger.warn('Error parsing ContinentUnlockEvent: ' + e.message + '\r\n' + jsonLogOutput(event));
            return false;
        }
        return true;
    }

    private storeEvent(continentUnlockEvent: ContinentUnlockEvent): void {
        // TODO Add to database
    }
}
