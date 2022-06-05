import {injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import DeathEvent from './events/DeathEvent';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandler from '../CharacterPresenceHandler';

@injectable()
export default class DeathEventHandler implements EventHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('DeathEventHandler');

    constructor(
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        @multiInject(TYPES.deathAggregates) private readonly aggregateHandlers: Array<EventHandlerInterface<DeathEvent>>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: DeathEvent): Promise<boolean> {
        DeathEventHandler.logger.silly(jsonLogOutput(event), {message: 'eventData'});
        DeathEventHandler.logger.silly('=== Processing DeathEvent Handlers ===');

        this.aggregateHandlers.map(
            (handler: EventHandlerInterface<DeathEvent>) => void handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        DeathEventHandler.logger.error(`Error parsing AggregateHandlers for DeathEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        DeathEventHandler.logger.error('UNEXPECTED ERROR parsing DeathEvent AggregateHandlers!');
                    }
                }),
        );

        DeathEventHandler.logger.silly('=== DeathEvent Handlers Processed! ===');

        return true;
    }
}
