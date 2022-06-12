import {injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandler from '../CharacterPresenceHandler';
import {PlayerFacilityCapture, PlayerFacilityDefend} from 'ps2census';

@injectable()
export default class PlayerFacilityEventHandler implements EventHandlerInterface<PlayerFacilityCapture|PlayerFacilityDefend> {
    private static readonly logger = getLogger('PlayerFacilityEventHandler');

    constructor(
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        @multiInject(TYPES.playerFacilityAggregates) private readonly aggregateHandlers: Array<EventHandlerInterface<PlayerFacilityCapture|PlayerFacilityDefend>>,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handle(event: PlayerFacilityCapture|PlayerFacilityDefend): Promise<boolean> {
        PlayerFacilityEventHandler.logger.debug('=== Processing PlayerFacilityEvent Handlers ===');

        this.aggregateHandlers.map(
            (handler: EventHandlerInterface<PlayerFacilityCapture|PlayerFacilityDefend>) => void handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        PlayerFacilityEventHandler.logger.error(`Error parsing AggregateHandlers for PlayerFacilityEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        PlayerFacilityEventHandler.logger.error('UNEXPECTED ERROR parsing PlayerFacilityEvent AggregateHandlers!');
                    }
                }),
        );

        PlayerFacilityEventHandler.logger.debug('=== PlayerFacilityEvent Handlers Processed! ===');

        return true;
    }
}
