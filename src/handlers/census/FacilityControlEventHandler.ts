import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import FacilityControlEvent from './events/FacilityControlEvent';
import ApplicationException from '../../exceptions/ApplicationException';
import {TYPES} from '../../constants/types';
import FactionUtils from '../../utils/FactionUtils';
import {InstanceFacilityControlSchemaInterface} from '../../models/instance/InstanceFacilityControlModel';
import MongooseModelFactory from '../../factories/MongooseModelFactory';
import InstanceActionFactory from '../../factories/InstanceActionFactory';
import {CensusEnvironment} from '../../types/CensusEnvironment';

@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('FacilityControlEventHandler');
    private readonly factory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly aggregateHandlers: Array<EventHandlerInterface<FacilityControlEvent>>;
    private readonly instanceActionFactory: InstanceActionFactory;

    /* eslint-disable */
    constructor(
        @inject(TYPES.instanceFacilityControlModelFactory) instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @multiInject(TYPES.facilityControlAggregates) aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[],
        @inject(TYPES.instanceActionFactory) instanceActionFactory: InstanceActionFactory
    ) {
        /* eslint-enable */
        this.factory = instanceFacilityControlModelFactory;
        this.aggregateHandlers = aggregateHandlers;
        this.instanceActionFactory = instanceActionFactory;
    }

    public async handle(event: FacilityControlEvent, environment: CensusEnvironment): Promise<boolean>{
        FacilityControlEventHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent.facilityControl) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        FacilityControlEventHandler.logger.debug(`[Instance ${event.instance.instanceId}] Facility ${event.facility.id} ${event.isDefence ? 'defended' : 'captured'} by ${FactionUtils.parseFactionIdToShortName(event.newFaction).toUpperCase()} ${event.isDefence ? '' : `from ${FactionUtils.parseFactionIdToShortName(event.oldFaction).toUpperCase()}`}`);

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
            (handler: EventHandlerInterface<FacilityControlEvent>) => void handler.handle(event, environment)
                .catch((e) => {
                    if (e instanceof Error) {
                        FacilityControlEventHandler.logger.error(`Error parsing AggregateHandlers for FacilityControlEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        FacilityControlEventHandler.logger.error('UNEXPECTED ERROR parsing FacilityControlEventHandler AggregateHandlers!');
                    }
                }),
        );

        // Handle Instance Events
        await this.instanceActionFactory.buildFacilityControlEvent(event.instance, environment, event.isDefence).execute().catch((e) => {
            if (e instanceof Error) {
                FacilityControlEventHandler.logger.error(`Error parsing Instance Action "facilityControlEvent" for FacilityControlEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                FacilityControlEventHandler.logger.error('UNEXPECTED ERROR running Instance Action "facilityControlEvent"!');
            }
        });

        return true;
    }

    private async storeEvent(event: FacilityControlEvent): Promise<boolean> {
        try {
            await this.factory.model.create({
                instance: event.instance.instanceId,
                facility: event.facility.id,
                timestamp: event.timestamp,
                oldFaction: event.oldFaction,
                newFaction: event.newFaction,
                durationHeld: event.durationHeld,
                isDefence: event.isDefence,
                outfitCaptured: event.outfitCaptured,
            });
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert FacilityControlEvent into DB! Instance: ${event.instance.instanceId} - ${err}\r\n${jsonLogOutput(event)}`, 'FacilityControlEventHandler');
            }
        }

        return false;
    }
}
