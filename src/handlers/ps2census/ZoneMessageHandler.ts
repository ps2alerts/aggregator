/* eslint-disable @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call */
// This handler is responsible for requeues and building the PS2EventQueueMessage with has various helpful data included.

import PS2EventQueueMessage from '../messages/PS2EventQueueMessage';
import {MaxRetryException, ZoneEvent} from 'ps2census';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../../interfaces/QueueMessageHandlerInterface';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';
import ApplicationException from '../../exceptions/ApplicationException';
import {Logger} from '@nestjs/common';
import ExceptionHandler from '../system/ExceptionHandler';
import {PS2EventQueueMessageHandlerInterface} from '../../interfaces/PS2EventQueueMessageHandlerInterface';
import TimeoutException from '../../exceptions/TimeoutException';
import {promiseTimeout} from '../../utils/PromiseTimeout';
import {Ps2AlertsEventType} from '../../ps2alerts-constants/ps2AlertsEventType';
import {getZoneIdFromBinary, getZoneInstanceIdFromBinary} from '../../utils/binaryZoneIds';
import OutfitWarsTerritoryInstance from '../../instances/OutfitWarsTerritoryInstance';

// eslint-disable-next-line @typescript-eslint/naming-convention
export default class ZoneMessageHandler<T extends ZoneEvent> implements QueueMessageHandlerInterface<T> {
    private static readonly logger = new Logger('ZoneMessageHandler');

    constructor(
        private readonly instance: PS2AlertsInstanceInterface,
        private readonly handlers: Array<PS2EventQueueMessageHandlerInterface<T>>,
    ) {}

    public async handle(event: T, actions: ChannelActionsInterface): Promise<void> {
        const zoneId = parseInt(event.zone_id, 10);

        // If Outfit wars, we need to handle zone ID in a different way
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (this.instance.ps2AlertsEventType === Ps2AlertsEventType.LIVE_METAGAME) {
            if (zoneId !== this.instance.zone) {
                return actions.ack();
            }
        } else {
            const instance = this.instance as OutfitWarsTerritoryInstance;
            const zoneIdDecoded = getZoneIdFromBinary(zoneId);
            const zoneInstanceId = getZoneInstanceIdFromBinary(zoneId);

            if (zoneIdDecoded !== this.instance.zone || zoneInstanceId !== instance.zoneInstanceId) {
                ZoneMessageHandler.logger.debug(`[${this.instance.instanceId}] Ignoring ${event.event_name} message as zone (${zoneIdDecoded}) and zoneInstanceId (${zoneInstanceId}) did not match instance!`);

                return actions.ack();
            }
        }

        // If the message came after the alert ended, chuck
        if (this.instance.messageOverdue(event)) {
            ZoneMessageHandler.logger.debug(`[${this.instance.instanceId}] Ignoring ${event.event_name} message as instance ended before this event's timestamp!`);
            return actions.ack();
        }

        // Send to handlers
        try {
            const promise = await promiseTimeout(Promise.all(
                this.handlers.map((handler) => handler.handle(
                    new PS2EventQueueMessage(event, this.instance),
                )),
            ), 45000);
            await Promise.race(promise);

            return actions.ack();
        } catch (err) {
            if (err instanceof MaxRetryException) {
                ZoneMessageHandler.logger.error(`[${this.instance.instanceId}] Census retries reached! Delaying message due to possible Census issues. Type: ${event.event_name} - Err: ${err.message}`);
                return actions.delay(5000);
            }

            if (err instanceof ApplicationException) {
                ZoneMessageHandler.logger.error(`[${this.instance.instanceId}] Unable to properly process ZoneMessage!Type: ${event.event_name} - Err: ${err.message}`);
                return actions.retry();
            }

            if (err instanceof TimeoutException) {
                ZoneMessageHandler.logger.error(`[${this.instance.instanceId}] ZoneMessage took too long to process! Waiting for a while before processing again due to load Type: ${event.event_name} - Err: ${err.message}`);
                return actions.delay(60000);
            }

            if (err instanceof Error) {
                actions.ack();
                new ExceptionHandler(`[${this.instance.instanceId}] Unexpected error occurred processing ZoneMessage! Type: ${event.event_name}`, err, 'ZoneMessageHandler');
            }

            // If we haven't got a specific means of handling the issue, drop it.
            return actions.ack();
        }
    }
}
