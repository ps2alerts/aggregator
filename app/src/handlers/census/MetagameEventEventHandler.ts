import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger, getLogsEnabled} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import MetagameEventEvent from './events/MetagameEventEvent';
import {TYPES} from '../../constants/types';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';

@injectable()
export default class MetagameEventEventHandler implements EventHandlerInterface<MetagameEventEvent> {
    private static readonly logger = getLogger('MetagameEventEventHandler');

    private readonly instanceHandler: InstanceHandlerInterface;

    constructor(@inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface) {
        this.instanceHandler = instanceHandler;
    }

    public async handle(event: MetagameEventEvent): Promise<boolean> {
        MetagameEventEventHandler.logger.info('Parsing MetagameEventEvent message...');

        if (getLogsEnabled().censusEventContent.metagameEvent) {
            MetagameEventEventHandler.logger.info(jsonLogOutput(event), {message: 'eventData'});
        }

        try {
            return await this.instanceHandler.handleMetagameEvent(event);
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
