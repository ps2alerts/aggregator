/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

// This class is usually called in front of ZoneMessageQueueHandler, not the actual handlers themselves.
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import {PS2Event} from 'ps2census';
import MetricsHandler from '../handlers/MetricsHandler';
import {Injectable} from '@nestjs/common';

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
        const started = new Date();

        const actionProxy: ChannelActionsInterface = new Proxy(actions, {
            get: (target: any, prop) => async () => {
                const metricName = `Event:${message.event_name}`;
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                await this.metricsHandler.logMetric(started, metricName);
                target[prop]();
            },
        });

        await handler.handle(message, actionProxy);
    }
}
