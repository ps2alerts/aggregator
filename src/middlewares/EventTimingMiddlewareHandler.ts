/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

// This class is usually called in front of ZoneMessageQueueHandler, not the actual handlers themselves.
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import {PS2Event} from 'ps2census';
import StatisticsHandler from '../handlers/StatisticsHandler';
import {Injectable} from '@nestjs/common';
import {METRICS_NAMES} from '../modules/monitoring/MetricsConstants';

@Injectable()
export default class EventTimingMiddlewareHandler {
    constructor(
        private readonly statisticsHandler: StatisticsHandler,
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
                await this.statisticsHandler.logMetric(started, metricName);
                this.statisticsHandler.increaseCounter(METRICS_NAMES.EVENT_TYPES, {type: message.event_name, world: message.world_id});
                target[prop]();
            },
        });

        await handler.handle(message, actionProxy);
    }
}
