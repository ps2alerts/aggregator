import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import ContinentLockEvent from './events/ContinentLockEvent';
import {PS2Event} from 'ps2census';

@injectable()
export default class ContinentLockEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('ContinentLockEventHandler');

    public async handle(event: PS2Event): Promise<boolean> {
        ContinentLockEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            ContinentLockEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const continentLockEvent = new ContinentLockEvent(event);
            await this.storeEvent(continentLockEvent);
            return true;
        } catch (e) {
            if (e instanceof Error) {
                ContinentLockEventHandler.logger.error(`Error parsing ContinentLockEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                ContinentLockEventHandler.logger.error('UNEXPECTED ERROR parsing ContinentLockEvent!');
            }

            return false;
        }
    }

    // WIP
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    private async storeEvent(continentLockEvent: ContinentLockEvent): Promise<boolean> {
        // TODO Store in database
        return true;
    }
}
