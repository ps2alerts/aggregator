import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import MetagameEventEvent from './events/MetagameEventEvent';
import {TYPES} from '../../constants/types';
import AlertHandlerInterface from '../../interfaces/AlertHandlerInterface';

@injectable()
export default class MetagameEventEventHandler implements EventHandlerInterface<MetagameEventEvent> {
    private static readonly logger = getLogger('MetagameEventEventHandler');

    private readonly alertHandler: AlertHandlerInterface;

    constructor(@inject(TYPES.alertHandlerInterface) alertHandler: AlertHandlerInterface) {
        this.alertHandler = alertHandler;
    }

    public async handle(event: MetagameEventEvent): Promise<boolean> {
        MetagameEventEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent.metagame) {
            MetagameEventEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            return await this.alertHandler.handleMetagameEvent(event);
        } catch (e) {
            if (e instanceof Error) {
                MetagameEventEventHandler.logger.error(`Error parsing MetagameEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                MetagameEventEventHandler.logger.error('UNEXPECTED ERROR parsing MetagameEvent!');
            }

            return false;
        }
    }
}
