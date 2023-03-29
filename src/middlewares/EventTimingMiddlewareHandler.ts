/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

// This class is usually called in front of ZoneMessageQueueHandler, not the actual handlers themselves.
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import {PS2Event} from 'ps2census';
import StatisticsHandler from '../handlers/StatisticsHandler';
import {Injectable} from '@nestjs/common';

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
        const startTime = new Date();

        const actionProxy: ChannelActionsInterface = new Proxy(actions, {
            get: (target: any, prop) => async () => {
                await this.logTime(startTime, message.event_name);
                target[prop]();
            },
        });

        await handler.handle(message, actionProxy);
    }

    // Log the time that it took to process the message, determined from the message time.
    private async logTime(started: Date, eventType: string): Promise<void> {
        await this.statisticsHandler.logTime(started, eventType);
    }
}
