// This handler is responsible for requeues and building the PS2EventQueueMessage with has various helpful data included.

import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import {MaxRetryException, ZoneEvent} from 'ps2census';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../../interfaces/QueueMessageHandlerInterface';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';
import {getLogger} from '../../logger';
import ApplicationException from '../../exceptions/ApplicationException';
import {PS2EventInstanceHandlerContract} from '../../interfaces/PS2EventInstanceHandlerContract';
import {injectable} from 'inversify';

@injectable()
// eslint-disable-next-line @typescript-eslint/naming-convention
export default class ZoneMessageHandler<T extends ZoneEvent> implements QueueMessageHandlerInterface<T>{
    private static readonly logger = getLogger('ZoneMessageHandler');

    constructor(
        private readonly instance: PS2AlertsInstanceInterface,
        private readonly handlers: Array<PS2EventInstanceHandlerContract<T>>,
    ) {}

    public async handle(event: T, actions: ChannelActionsInterface): Promise<void> {
        // Send to handlers
        try {
            await Promise.all(
                this.handlers.map((handler) => handler.handle(
                    new PS2EventQueueMessage(event, this.instance),
                )),
            );
            actions.ack();
            return;
        } catch (err) {
            if (err instanceof MaxRetryException) {
                ZoneMessageHandler.logger.error(`Maximum Census retries reached! Err: ${err.message}`);
                actions.nack(); // TODO: Requeue
            }

            if (err instanceof ApplicationException) {
                ZoneMessageHandler.logger.error(`Unable to properly process ZoneMessage! Err: ${err.message}`);
                actions.nack(); // TODO: Requeue
            }

            if (err instanceof Error) {
                ZoneMessageHandler.logger.error(`Unresolvable error occurred! Chucking message! Err: ${err.message}`);
                actions.nack(); // Do not requeue
            }
        }

        throw new ApplicationException('UNEXPECTED EXECUTION PATH REACHED!', 'ZoneMessageHandler');
    }
}
