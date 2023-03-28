/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

// This class is usually called in front of ZoneMessageQueueHandler, not the actual handlers themselves.
<<<<<<<< HEAD:src/services/rabbitmq/middlewares/TimingMiddlewareHandler.ts
import {Injectable} from '@nestjs/common';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../../../interfaces/QueueMessageHandlerInterface';
import Redis from 'ioredis';
import {PS2Event} from 'ps2census';
import config from '../../../config';

@Injectable()
export default class TimingMiddlewareHandler {
    private readonly runId = config.app.runId;

    constructor(private readonly cacheClient: Redis) {}
========
import {injectable} from 'inversify';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import {PS2Event} from 'ps2census';
import StatisticsHandler from '../handlers/StatisticsHandler';

@injectable()
export default class EventTimingMiddlewareHandler {
    constructor(
        private readonly statisticsHandler: StatisticsHandler,
    ) {}
>>>>>>>> dev:src/services/rabbitmq/middlewares/EventTimingMiddlewareHandler.ts

    public async handle(
        message: PS2Event,
        actions: ChannelActionsInterface,
        handler: QueueMessageHandlerInterface<PS2Event>,
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
