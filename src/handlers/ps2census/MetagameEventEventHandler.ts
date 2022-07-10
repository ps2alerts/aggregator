import {injectable} from 'inversify';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import {MetagameEventState} from '../../ps2alerts-constants/metagameEventState';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';
import {Ps2alertsEventState} from '../../ps2alerts-constants/ps2alertsEventState';
import InstanceAuthority from '../../authorities/InstanceAuthority';
import {Bracket} from '../../ps2alerts-constants/bracket';
import {MetagameEvent} from 'ps2census';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../../interfaces/QueueMessageHandlerInterface';
import MetagameEventEvent from './events/MetagameEventEvent';

@injectable()
export default class MetagameEventEventHandler implements QueueMessageHandlerInterface<MetagameEvent> {
    private static readonly logger = getLogger('MetagameEventEventHandler');

    constructor(private readonly instanceAuthority: InstanceAuthority) {}

    public async handle(metagameEvent: MetagameEvent, actions: ChannelActionsInterface): Promise<void> {
        MetagameEventEventHandler.logger.debug('Parsing MetagameEventEvent message...');

        const event = new MetagameEventEvent(metagameEvent);

        if (config.features.logging.censusEventContent.metagame) {
            MetagameEventEventHandler.logger.info(jsonLogOutput(event), {message: 'eventData'});
        }

        // Note because Metagame is a world message, it is not subject to filtering by Ps2censusMessageHandler, so it may not return an instance intentionally.
        const instance = this.instanceAuthority.getInstance(`${event.world}-${event.instanceId}`);

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

            const metagameTerritoryInstance = new MetagameTerritoryInstance(
                event.world,
                event.timestamp,
                null,
                null,
                event.details.zone,
                event.instanceId,
                event.eventType,
                event.details.duration,
                Ps2alertsEventState.STARTING,
                Bracket.UNKNOWN, // Force the bracket to be unknown as it is incalculable at the beginning
            );

            try {
                await this.instanceAuthority.startInstance(metagameTerritoryInstance);
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
        return actions.nack();
    }
}
