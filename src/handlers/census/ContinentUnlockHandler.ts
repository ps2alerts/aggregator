import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import ContinentUnlockEvent from './events/ContinentUnlockEvent';

@injectable()
export default class ContinentUnlockHandler implements EventHandlerInterface<ContinentUnlockEvent> {
    private static readonly logger = getLogger('ContinentUnlockHandler');

    public async handle(event: ContinentUnlockEvent): Promise<boolean>{
        ContinentUnlockHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent) {
            ContinentUnlockHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            await this.storeEvent(event);
        } catch (e) {
            if (e instanceof Error) {
                ContinentUnlockHandler.logger.error(`Error parsing ContinentUnlock: ${e.message}\r\n${jsonLogOutput(event)}`);
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
