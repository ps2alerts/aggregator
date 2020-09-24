import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import FacilityControlEvent from './events/FacilityControlEvent';
import ApplicationException from '../../exceptions/ApplicationException';
import {TYPES} from '../../constants/types';
import CharacterPresenceHandlerInterface from '../../interfaces/CharacterPresenceHandlerInterface';
import FactionUtils from '../../utils/FactionUtils';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage, {ApiMQOperations} from '../../data/ApiMQMessage';

@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('FacilityControlEventHandler');
    private readonly playerHandler: CharacterPresenceHandlerInterface;
    private readonly apiMQPublisher: ApiMQPublisher;

    /* eslint-disable */
    private aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[];

    constructor(
        @inject(TYPES.characterPresenceHandlerInterface) playerHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher,
        @multiInject(TYPES.facilityControlAggregates) aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[]
    ) {
        /* eslint-enable */
        this.playerHandler = playerHandler;
        this.apiMQPublisher = apiMQPublisher;
        this.aggregateHandlers = aggregateHandlers;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean>{
        FacilityControlEventHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent.facilityControl) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        FacilityControlEventHandler.logger.debug(`[Instance ${event.instance.instanceId}] Facility ${event.facility} ${event.isDefence ? 'defended' : 'captured'} by ${FactionUtils.parseFactionIdToShortName(event.newFaction).toUpperCase()} ${event.isDefence ? '' : `from ${FactionUtils.parseFactionIdToShortName(event.oldFaction).toUpperCase()}`}`);

        try {
            await this.storeEvent(event);
        } catch (e) {
            if (e instanceof Error) {
                FacilityControlEventHandler.logger.error(`Error parsing FacilityControlEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                FacilityControlEventHandler.logger.error('UNEXPECTED ERROR parsing FacilityControlEvent!');
            }

            return false;
        }

        this.aggregateHandlers.map(
            (handler: EventHandlerInterface<FacilityControlEvent>) => void handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        FacilityControlEventHandler.logger.error(`Error parsing AggregateHandlers for FacilityControlEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        FacilityControlEventHandler.logger.error('UNEXPECTED ERROR parsing FacilityControlEventHandler AggregateHandlers!');
                    }
                }),
        );

        return true;
    }

    private async storeEvent(event: FacilityControlEvent): Promise<boolean> {
        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                'facilityControlEvent',
                ApiMQOperations.CREATE,
                [{
                    instance: event.instance.instanceId,
                    facility: event.facility,
                    timestamp: event.timestamp,
                    oldFaction: event.oldFaction,
                    newFaction: event.newFaction,
                    durationHeld: event.durationHeld,
                    isDefence: event.isDefence,
                    outfitCaptured: event.outfitCaptured,
                }],
            ));
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to pass FacilityControlEvent to API! E: ${err}`, 'FacilityControlEventHandler');
        }
    }
}
