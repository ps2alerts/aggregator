import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import ContinentLockEvent from './events/ContinentLockEvent';

@injectable()
export default class ContinentLockEventHandler implements EventHandlerInterface<ContinentLockEvent> {
    private static readonly logger = getLogger('ContinentLockEventHandler');

    public async handle(event: ContinentLockEvent): Promise<boolean> {
        ContinentLockEventHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent) {
            ContinentLockEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await this.storeEvent(event);
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
