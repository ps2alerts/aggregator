/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */

// This class is usually called in front of ZoneMessageQueueHandler, not the actual handlers themselves.
import {injectable} from 'inversify';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import Redis from 'ioredis';
import {PS2Event} from 'ps2census';
import config from '../config';

@injectable()
export default class TimingMiddlewareHandler {
    private readonly runId = config.app.runId;

    constructor(private readonly cacheClient: Redis) {}

    public async handle(
        message: PS2Event,
        actions: ChannelActionsInterface,
        handler: QueueMessageHandlerInterface<PS2Event>,
    ): Promise<void> {
        const time = Date.now();
        const actionProxy: ChannelActionsInterface = new Proxy(actions, {
            get: (target: any, prop) => async () => {
                await this.logTime(time - message.timestamp.getTime(), message.event_name);
                target[prop]();
            },
        });

        await handler.handle(message, actionProxy);
    }

    // Log the time that it took to process the message, determined from the message time.
    private async logTime(ms: number, eventType: string): Promise<void> {
        const listKey = `metrics-messages-${eventType}-${this.runId}`;

        await this.cacheClient.lpush(listKey, ms);
    }
}
