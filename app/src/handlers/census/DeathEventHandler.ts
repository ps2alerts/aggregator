import { injectable } from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import { GenericEvent } from 'ps2census/dist/client/utils/PS2Events';
import { getLogger } from '../../logger';
import config from '../../config';
import { jsonLogOutput } from '../../utils/json';


@injectable()
export default class DeathEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('DeathEventHandler');

    public handle(event: GenericEvent): boolean {
        DeathEventHandler.logger.debug('Parsing message...');
        if (config.features.logging.censusEventContent) {
            DeathEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }
        // TODO: Microwave is going to convert Census library to pass through DeathEvent object etc
        return true;
    }
}
