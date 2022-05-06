import {inject, injectable, multiInject} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import FacilityControlEvent from './events/FacilityControlEvent';
import {TYPES} from '../../constants/types';
import FactionUtils from '../../utils/FactionUtils';
import InstanceActionFactory from '../../factories/InstanceActionFactory';
import InstanceAuthority from '../../authorities/InstanceAuthority';
import {AxiosInstance} from 'axios';
import {ps2AlertsApiEndpoints} from '../../constants/ps2AlertsApiEndpoints';

@injectable()
export default class FacilityControlEventHandler implements EventHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('FacilityControlEventHandler');

    constructor(
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        @multiInject(TYPES.facilityControlAggregates) private readonly aggregateHandlers: Array<EventHandlerInterface<FacilityControlEvent>>,
        private readonly instanceActionFactory: InstanceActionFactory,
        private readonly instanceAuthority: InstanceAuthority,
    ) {}

    public async handle(event: FacilityControlEvent): Promise<boolean>{
        FacilityControlEventHandler.logger.silly('Parsing message...');

        if (config.features.logging.censusEventContent.facilityControl) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        FacilityControlEventHandler.logger.debug(`[Instance ${event.instance.instanceId}] Facility ${event.facility.id} ${event.isDefence ? 'defended' : 'captured'} by ${FactionUtils.parseFactionIdToShortName(event.newFaction).toUpperCase()} ${event.isDefence ? '' : `from ${FactionUtils.parseFactionIdToShortName(event.oldFaction).toUpperCase()}`}`);

        const facilityData = {
            instance: event.instance.instanceId,
            facility: event.facility.id,
            timestamp: event.timestamp,
            oldFaction: event.oldFaction,
            newFaction: event.newFaction,
            durationHeld: event.durationHeld,
            isDefence: event.isDefence,
            outfitCaptured: event.outfitCaptured,
            mapControl: null, // This is null intentionally because we haven't calculated the control result yet (it's done in the handlers)
        };

        await this.ps2AlertsApiClient.post(
            ps2AlertsApiEndpoints.instanceEntriesInstanceFacility.replace('{instanceId}', event.instance.instanceId),
            facilityData,
        ).catch(async (err: Error) => {
            FacilityControlEventHandler.logger.warn(`[${event.instance.instanceId}] Unable to create facility control record via API! Err: ${err.message}`);

            // Try again
            await this.ps2AlertsApiClient.post(
                ps2AlertsApiEndpoints.instanceEntriesInstanceFacility.replace('{instanceId}', event.instance.instanceId),
                facilityData,
            ).catch((err: Error) => {
                FacilityControlEventHandler.logger.error(`[${event.instance.instanceId}] Unable to create facility control record via API for a SECOND time! Aborting! Err: ${err.message}`);
                return false;
            });
        });

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

        // Handle Instance Events
        await this.instanceActionFactory.buildFacilityControlEvent(event).execute().catch((e) => {
            if (e instanceof Error) {
                FacilityControlEventHandler.logger.error(`Error parsing Instance Action "facilityControlEvent" for FacilityControlEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                FacilityControlEventHandler.logger.error('UNEXPECTED ERROR running Instance Action "facilityControlEvent"!');
            }
        });

        // Now handlers and everything have run, update the mapControl record, since we now know the result values.
        // Note: This will update the LATEST record, it is assumed it is created first.
        const result = this.instanceAuthority.getInstance(event.instance.instanceId).result;
        await this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.instanceEntriesInstanceFacilityFacility
                .replace('{instanceId}', event.instance.instanceId)
                .replace('{facilityId}', String(event.facility.id)),
            {mapControl: result},
        ).catch((err: Error) => {
            FacilityControlEventHandler.logger.error(`[${event.instance.instanceId}] Unable to update the facility control record via API! Err: ${err.message}`);
        });
        return true;
    }
}
