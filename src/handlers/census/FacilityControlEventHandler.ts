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
import InstanceAuthority from '../../authorities/InstanceAuthority';

@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('FacilityControlEventHandler');
    private readonly factory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly aggregateHandlers: Array<EventHandlerInterface<FacilityControlEvent>>;
    private readonly instanceActionFactory: InstanceActionFactory;
    private readonly instanceAuthority: InstanceAuthority;

    /* eslint-disable */
    constructor(
        @inject(TYPES.instanceFacilityControlModelFactory) instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @multiInject(TYPES.facilityControlAggregates) aggregateHandlers: EventHandlerInterface<FacilityControlEvent>[],
        @inject(TYPES.instanceActionFactory) instanceActionFactory: InstanceActionFactory,
        @inject(TYPES.instanceAuthority) instanceAuthority: InstanceAuthority
    ) {
        /* eslint-enable */
        this.factory = instanceFacilityControlModelFactory;
        this.aggregateHandlers = aggregateHandlers;
        this.instanceActionFactory = instanceActionFactory;
        this.instanceAuthority = instanceAuthority;
    }

    public async handle(event: FacilityControlEvent, environment: CensusEnvironment): Promise<boolean>{
        FacilityControlEventHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent.facilityControl) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        FacilityControlEventHandler.logger.debug(`[Instance ${event.instance.instanceId}] Facility ${event.facility.id} ${event.isDefence ? 'defended' : 'captured'} by ${FactionUtils.parseFactionIdToShortName(event.newFaction).toUpperCase()} ${event.isDefence ? '' : `from ${FactionUtils.parseFactionIdToShortName(event.oldFaction).toUpperCase()}`}`);

        let objectId = null;

        try {
            objectId = await this.storeEvent(event);
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

        if (!objectId) {
            FacilityControlEventHandler.logger.error('No object ID was returned to apply the Map Control! "facilityControlEvent"!');
            return true;
        }

        // Now handlers and everything have run, update the mapControl
        await this.storeMapControl(event, objectId);
        return true;
    }

    private async storeEvent(event: FacilityControlEvent): Promise<string | null> {
        const doc = {
            instance: event.instance.instanceId,
            facility: event.facility.id,
            timestamp: event.timestamp,
            oldFaction: event.oldFaction,
            newFaction: event.newFaction,
            durationHeld: event.durationHeld,
            isDefence: event.isDefence,
            outfitCaptured: event.outfitCaptured,
            mapControl: null,
        };

        try {
            const resultObject = await this.factory.model.create(doc);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return resultObject._id;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert FacilityControlEvent into DB! Instance: ${event.instance.instanceId} - ${err}\r\n${jsonLogOutput(event)}`, 'FacilityControlEventHandler');
            }
        }

        return null;
    }

    private async storeMapControl(event: FacilityControlEvent, objectId: string): Promise<boolean> {
        // Result should be established and updated in the active instance list by the time storeMapControl is called.
        const result = this.instanceAuthority.getInstance(event.instance.instanceId).result;
        const doc = {
            mapControl: {
                vs: result?.vs ?? 0,
                nc: result?.nc ?? 0,
                tr: result?.tr ?? 0,
                cutoff: result?.cutoff ?? 0,
                outOfPlay: result?.outOfPlay ?? 0,
            },
        };

        try {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            await this.factory.model.updateOne({_id: objectId}, doc);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert FacilityControlEvent storeMapControl into DB! Instance: ${event.instance.instanceId} - ${err}\r\n${jsonLogOutput(event)}`, 'FacilityControlEventHandler');
            }
        }

        return false;
    }
}
