import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import FacilityControlEvent from './events/FacilityControlEvent';
import ApplicationException from '../../exceptions/ApplicationException';
import {TYPES} from '../../constants/types';
import PlayerHandlerInterface from '../../interfaces/PlayerHandlerInterface';
import MongooseModelFactory from '../../factories/MongooseModelFactory';
import {AlertFacilityControlInterface} from '../../models/AlertFacilityControlModel';

@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('FacilityControlEventHandler');

    private readonly playerHandler: PlayerHandlerInterface;

    private readonly factory: MongooseModelFactory<AlertFacilityControlInterface>;

    /* eslint-disable */
    private aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[];

    constructor(
        @inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface,
        @inject(TYPES.alertFacilityControlModelFactory) alertFacilityControlModelFactory: MongooseModelFactory<AlertFacilityControlInterface>,
        @multiInject(TYPES.facilityControlAggregates) aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[]
    ) {
        /* eslint-enable */
        this.playerHandler = playerHandler;
        this.factory = alertFacilityControlModelFactory;
        this.aggregateHandlers = aggregateHandlers;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean>{
        FacilityControlEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent.facilityControl) {
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
                alert: event.alert.alertId,
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
            throw new ApplicationException(`Unable to insert FacilityControlEvent into DB! Alert: ${event.alert.alertId} - ${err}\r\n${jsonLogOutput(event)}`, 'FacilityControlEventHandler');
        }
    }
}
