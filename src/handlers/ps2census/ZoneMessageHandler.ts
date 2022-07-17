// This handler is responsible for requeues and building the PS2EventQueueMessage with has various helpful data included.

import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import {MaxRetryException, ZoneEvent} from 'ps2census';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../../interfaces/QueueMessageHandlerInterface';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';
import {getLogger} from '../../logger';
import ApplicationException from '../../exceptions/ApplicationException';
import {PS2EventInstanceHandlerContract} from '../../interfaces/PS2EventInstanceHandlerContract';
import {injectable} from 'inversify';
import ExceptionHandler from '../system/ExceptionHandler';

@injectable()
// eslint-disable-next-line @typescript-eslint/naming-convention
export default class ZoneMessageHandler<T extends ZoneEvent> implements QueueMessageHandlerInterface<T>{
    private static readonly logger = getLogger('ZoneMessageHandler');

    constructor(
        private readonly instance: PS2AlertsInstanceInterface,
        private readonly handlers: Array<PS2EventInstanceHandlerContract<T>>,
    ) {}

    public async handle(event: T, actions: ChannelActionsInterface): Promise<void> {
        // Ensure the event's zone matches the instance zone, because the queue holds messages from the entire world and event type
        if (parseInt(event.zone_id, 10) !== this.instance.zone) {
            return actions.ack();
        }

        // If the message came after the alert ended, chuck
        if (this.instance.messageOverdue(event.timestamp)) {
            ZoneMessageHandler.logger.warn(`[${this.instance.instanceId}] Ignoring message as instance ended before this event came in!`);
            return actions.ack();
        }

        // Send to handlers
        try {
            await Promise.all(
                this.handlers.map((handler) => handler.handle(
                    new PS2EventQueueMessage(event, this.instance),
                )),
            );
            return actions.ack();
        } catch (err) {
            if (err instanceof MaxRetryException) {
                ZoneMessageHandler.logger.error(`Maximum Census retries reached! Type: ${event.event_name} - Err: ${err.message}`);
                return actions.ack(); // TODO: Requeue
            }

            if (err instanceof ApplicationException) {
                ZoneMessageHandler.logger.error(`Unable to properly process ZoneMessage!Type: ${event.event_name} - Err: ${err.message}`);
                return actions.ack(); // TODO: Requeue
            }

            if (err instanceof Error) {
                new ExceptionHandler(`Unexpected error occurred processing ZoneMessage! Type: ${event.event_name}`, err, 'ZoneMessageHandler');
                return actions.ack(); // Do not requeue
            }
        }

        throw new ApplicationException('UNEXPECTED EXECUTION PATH REACHED!', 'ZoneMessageHandler');
    }
}
