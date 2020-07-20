import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import ContinentUnlockEvent from './events/ContinentUnlockEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class ContinentUnlockHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('ContinentUnlockHandler');

    public async handle(event: PS2Event): Promise<boolean>{
        ContinentUnlockHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            ContinentUnlockHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const continentUnlockEvent = new ContinentUnlockEvent(event);
            await this.storeEvent(continentUnlockEvent);
        } catch (e) {
            if (e instanceof Error) {
                ContinentUnlockHandler.logger.warn(`Error parsing ContinentUnlock: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                ContinentUnlockHandler.logger.error('UNKNOWN ERROR parsing ContinentUnlock!');
            }

            return false;
        }

        return true;
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(continentUnlockEvent: ContinentUnlockEvent): Promise<boolean> {
        return true;
        // TODO Add to database
    }
}
