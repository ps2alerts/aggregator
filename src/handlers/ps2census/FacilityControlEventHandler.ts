import {Inject, Injectable, Logger} from '@nestjs/common';
import FacilityControlEvent from './events/FacilityControlEvent';
import {TYPES} from '../../constants/types';
import InstanceActionFactory from '../../factories/InstanceActionFactory';
import {AxiosInstance} from 'axios';
import {FacilityControl} from 'ps2census';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import FacilityDataBroker from '../../brokers/FacilityDataBroker';
import {ps2AlertsApiEndpoints} from '../../ps2alerts-constants/ps2AlertsApiEndpoints';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import {Ps2AlertsEventType} from '../../ps2alerts-constants/ps2AlertsEventType';

@Injectable()
export default class FacilityControlEventHandler implements PS2EventQueueMessageHandlerInterface<FacilityControl> {
    public readonly eventName = 'FacilityControl';
    private static readonly logger = new Logger('FacilityControlEventHandler');

    constructor(
        private readonly facilityDataBroker: FacilityDataBroker,
        private readonly instanceActionFactory: InstanceActionFactory,
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        @Inject(TYPES.facilityControlAggregates) private readonly aggregateHandlers: Array<AggregateHandlerInterface<FacilityControlEvent>>,
    ) {}

    public async handle(event: PS2EventQueueMessage<FacilityControl>): Promise<boolean>{
        FacilityControlEventHandler.logger.debug('Parsing message...');

        if (config.features.logging.censusEventContent.facilityControl) {
            FacilityControlEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        const facilityEvent = new FacilityControlEvent(event, await this.facilityDataBroker.get(event));

        FacilityControlEventHandler.logger.debug(`[${facilityEvent.instance.instanceId}] Facility ${facilityEvent.facility.id} (${facilityEvent.facility.name}) ${facilityEvent.isDefence ? 'defended' : 'captured'} by ${facilityEvent.newFactionName.toUpperCase()} ${facilityEvent.isDefence ? '' : `from ${facilityEvent.oldFactionName.toUpperCase()}`}`);

        const facilityData = {
            instance: facilityEvent.instance.instanceId,
            facility: facilityEvent.facility.id,
            timestamp: facilityEvent.timestamp,
            oldFaction: facilityEvent.oldFaction,
            newFaction: facilityEvent.newFaction,
            durationHeld: facilityEvent.durationHeld,
            isDefence: facilityEvent.isDefence,
            outfitCaptured: facilityEvent.outfitCaptured,
            mapControl: null, // This is null intentionally because we haven't calculated the control result yet (it's done in the handlers)
        };

        let endpoint = '';

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (event.instance.ps2AlertsEventType === Ps2AlertsEventType.LIVE_METAGAME) {
            endpoint = ps2AlertsApiEndpoints.instanceEntriesInstanceFacility.replace('{instanceId}', event.instance.instanceId);
        } else {
            endpoint = ps2AlertsApiEndpoints.outfitwarsInstanceFacility.replace('{instanceId}', event.instance.instanceId);
        }

        await this.ps2AlertsApiClient.post(endpoint, facilityData).catch(async (err: Error) => {
            FacilityControlEventHandler.logger.warn(`[${event.instance.instanceId}] Unable to create facility control record via API! Err: ${err.message}`);

            // Try again
            await this.ps2AlertsApiClient.post(endpoint, facilityData).catch((err: Error) => {
                FacilityControlEventHandler.logger.error(`[${event.instance.instanceId}] Unable to create facility control record via API for a SECOND time! Aborting! Err: ${err.message}`);
                return false;
            });
        });

        this.aggregateHandlers.map(
            (handler: AggregateHandlerInterface<FacilityControlEvent>) => void handler.handle(facilityEvent)
                .catch((e) => {
                    if (e instanceof Error) {
                        FacilityControlEventHandler.logger.error(`Error parsing AggregateHandlers for FacilityControlEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        FacilityControlEventHandler.logger.error('UNEXPECTED ERROR parsing FacilityControlEventHandler AggregateHandlers!');
                    }
                }),
        );

        // Handle Instance Events
        await this.instanceActionFactory.buildFacilityControlEvent(facilityEvent).execute().catch((e) => {
            if (e instanceof Error) {
                FacilityControlEventHandler.logger.error(`Error parsing Instance Action "facilityControlEvent" for FacilityControlEventHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
            } else {
                FacilityControlEventHandler.logger.error('UNEXPECTED ERROR running Instance Action "facilityControlEvent"!');
            }
        });

        return true;
    }
}
