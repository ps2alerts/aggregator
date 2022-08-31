/* eslint-disable no-case-declarations,@typescript-eslint/no-unsafe-member-access */
import {inject, injectable} from 'inversify';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {MetagameEventState} from '../../ps2alerts-constants/metagameEventState';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';
import {Ps2AlertsEventState} from '../../ps2alerts-constants/ps2AlertsEventState';
import InstanceAuthority from '../../authorities/InstanceAuthority';
import {Bracket} from '../../ps2alerts-constants/bracket';
import {MetagameEvent} from 'ps2census';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../../interfaces/QueueMessageHandlerInterface';
import MetagameEventEvent from './events/MetagameEventEvent';
import {MetagameEventType} from '../../ps2alerts-constants/metagameEventType';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';
import OutfitWarsTerritoryInstance from '../../instances/OutfitWarsTerritoryInstance';
import {getOutfitWarPhase, getOutfitWarRound} from '../../ps2alerts-constants/outfitwars/utils';
import {getZoneInstanceIdFromBinary} from '../../utils/binaryZoneIds';
import {Zone} from '../../ps2alerts-constants/zone';
import {TYPES} from '../../constants/types';
import {AxiosInstance} from 'axios';
import {ps2AlertsApiEndpoints} from '../../ps2alerts-constants/ps2AlertsApiEndpoints';
import {OutfitwarsRankingInterface} from '../../ps2alerts-constants/interfaces/OutfitwarsRankingInterface';

@injectable()
export default class MetagameEventEventHandler implements QueueMessageHandlerInterface<MetagameEvent> {
    private static readonly logger = getLogger('MetagameEventEventHandler');

    constructor(
        private readonly instanceAuthority: InstanceAuthority,
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
    ) {}

    public async handle(metagameEvent: MetagameEvent, actions: ChannelActionsInterface): Promise<void> {
        MetagameEventEventHandler.logger.debug('Parsing MetagameEventEvent message...');

        const event = new MetagameEventEvent(metagameEvent);

        if (config.features.logging.censusEventContent.metagame) {
            MetagameEventEventHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        // Note because Metagame is a world message, it is not subject to filtering by Ps2censusMessageHandler, so it may not return an instance intentionally.
        let instanceId = `${event.world}-${event.instanceId}`;
        let round = 0;

        /* eslint-disable no-bitwise */
        if ((event.zone >> 16) !== 0 && (event.zone & 0xFFFF) === Zone.NEXUS) {
            instanceId = `outfitwars-${event.world}-${Zone.NEXUS}-${(event.zone >> 16) & 0xFFFF}`;
            await this.ps2AlertsApiClient.get(`${ps2AlertsApiEndpoints.outfitwarsRankings}?sortBy=round&order=desc&world=${event.world}`).then(
                (value) => {
                    if (!value.data) {
                        throw new Error('No data received!');
                    }

                    const rankings: OutfitwarsRankingInterface[] = value.data as OutfitwarsRankingInterface[];
                    round = rankings[0].round;
                },
            ).catch((err: Error) => {
                MetagameEventEventHandler.logger.warn(`Failed to retrieve rankings to get round, falling back to timestamp: ${err.message}`);
                round = getOutfitWarRound(event.timestamp);
            });
        }
        /* eslint-enable no-bitwise */

        const instance = this.instanceAuthority.getInstance(instanceId);

        if (event.eventState === MetagameEventState.STARTED && instance) {
            MetagameEventEventHandler.logger.error(`Attempted to start an already existing instance! ${event.instanceId} W: ${event.world} - Z: ${event.zone}`);
            return actions.ack();
        }

        if (event.eventState === MetagameEventState.FINISHED && !instance) {
            MetagameEventEventHandler.logger.error(`Attempted to end an instance that does not exist! ${event.instanceId} W: ${event.world} - Z: ${event.zone}`);
            return actions.ack();
        }

        if (event.eventState === MetagameEventState.STARTED && !instance) {
            if (!event.details) {
                MetagameEventEventHandler.logger.error('Unsupported alert detected!');
                return actions.ack();
            }

            if (!config.census.metagameCreationsEnabled) {
                MetagameEventEventHandler.logger.info('Ignoring metagame event message as metagame creations are disabled.');
                return actions.ack();
            }

            let instance: PS2AlertsInstanceInterface;

            switch (event.eventType) {
                case MetagameEventType.NEXUS_OUTFIT_WAR:
                    const phase = getOutfitWarPhase(round);
                    instance = new OutfitWarsTerritoryInstance(
                        event.world,
                        Zone.NEXUS,
                        getZoneInstanceIdFromBinary(event.zone),
                        event.timestamp,
                        null,
                        null,
                        Ps2AlertsEventState.STARTING,
                        {phase, round},
                    );
                    break;
                default:
                    instance = new MetagameTerritoryInstance(
                        event.world,
                        event.details.zone,
                        event.instanceId,
                        event.timestamp,
                        null,
                        null,
                        event.eventType,
                        event.details.duration,
                        Ps2AlertsEventState.STARTING,
                        Bracket.UNKNOWN, // Force the bracket to be unknown as it is incalculable at the beginning
                    );
                    break;
            }

            try {
                await this.instanceAuthority.startInstance(instance);
                return actions.ack();
            } catch (e) {
                if (e instanceof Error) {
                    MetagameEventEventHandler.logger.error(`Error parsing MetagameEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
                } else {
                    MetagameEventEventHandler.logger.error('UNEXPECTED ERROR parsing MetagameEvent!');
                }

                return actions.ack(); // TODO: REQUEUE
            }
        }

        if (event.eventState === MetagameEventState.FINISHED && instance) {
            try {
                await this.instanceAuthority.endInstance(instance);
                return actions.ack();
            } catch (e) {
                if (e instanceof Error) {
                    MetagameEventEventHandler.logger.error(`Error parsing MetagameEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
                } else {
                    MetagameEventEventHandler.logger.error('UNEXPECTED ERROR parsing MetagameEvent!');
                }

                return actions.ack(); // TODO: REQUEUE
            }
        }

        // This should never happen
        MetagameEventEventHandler.logger.error('UNEXPECTED EXECUTION PATH processing MetagameEvent!');
        return actions.ack();
    }
}
