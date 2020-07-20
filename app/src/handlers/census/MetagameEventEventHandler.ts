import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import MetagameEventEvent from './events/MetagameEventEvent';
import {TYPES} from '../../constants/types';
import AlertHandlerInterface from '../../interfaces/AlertHandlerInterface';
import {PS2Event} from 'ps2census';

@injectable()
export default class MetagameEventEventHandler implements EventHandlerInterface {
    private static readonly logger = getLogger('MetagameEventEventHandler');

    private readonly alertHandler: AlertHandlerInterface;

    constructor(@inject(TYPES.alertHandlerInterface) alertHandler: AlertHandlerInterface) {
        this.alertHandler = alertHandler;
    }

    public async handle(event: PS2Event): Promise<boolean> {
        MetagameEventEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent) {
            MetagameEventEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            const mge = new MetagameEventEvent(event);
            await this.alertHandler.handleMetagameEvent(mge);
            return true;
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
