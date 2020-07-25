import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger, getLogsEnabled} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import FacilityControlEvent from './events/FacilityControlEvent';
import ApplicationException from '../../exceptions/ApplicationException';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import MongooseModelFactory from '../../factories/MongooseModelFactory';
import {InstanceFacilityControlInterface} from '../../models/InstanceFacilityControlModel';

@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('FacilityControlEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    private readonly factory: MongooseModelFactory<InstanceFacilityControlInterface>;

    /* eslint-disable */
    private aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[];

    constructor(
        @inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface,
        @inject(TYPES.instanceFacilityControlModelFactory) instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlInterface>,
        @multiInject(TYPES.facilityControlAggregates) aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[]
    ) {
        /* eslint-enable */
        this.playerHandler = playerHandler;
        this.factory = instanceFacilityControlModelFactory;
        this.aggregateHandlers = aggregateHandlers;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean>{
        FacilityControlEventHandler.logger.debug('Parsing message...');

        if (getLogsEnabled().censusEventContent.facilityControl) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

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
            await this.factory.saveDocument({
                instance: event.instance.instanceId,
                facility: event.facility,
                timestamp: event.timestamp,
                oldFaction: event.oldFaction,
                newFaction: event.newFaction,
                durationHeld: event.durationHeld,
                isDefence: event.isDefence,
                outfitCaptured: event.outfitCaptured,
            });
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert FacilityControlEvent into DB! Instance: ${event.instance.instanceId} - ${err}\r\n${jsonLogOutput(event)}`, 'FacilityControlEventHandler');
        }
    }
}
