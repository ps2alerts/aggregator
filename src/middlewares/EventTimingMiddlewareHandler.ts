/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

// This class is usually called in front of ZoneMessageQueueHandler, not the actual handlers themselves.
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import {PS2Event} from 'ps2census';
import MetricsHandler from '../handlers/MetricsHandler';
import {Injectable} from '@nestjs/common';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';

@Injectable()
export default class EventTimingMiddlewareHandler {
    constructor(
        private readonly metricsHandler: MetricsHandler,
    ) {
    }

    public async handle(
        message: PS2Event<any>,
        actions: ChannelActionsInterface,
        handler: QueueMessageHandlerInterface<PS2Event<any>>,
    ): Promise<void> {
        const timer = this.metricsHandler.getHistogram(METRICS_NAMES.EVENT_PROCESSING_HISTOGRAM, {eventType: message.event_name});

        const actionProxy: ChannelActionsInterface = new Proxy(actions, {
            get: (target: any, prop) => () => {
                timer();
                target[prop]();
            },
        });

        await handler.handle(message, actionProxy);
    }
}
