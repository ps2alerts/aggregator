// noinspection JSMethodCanBeStatic

import {Injectable, Logger, OnModuleInit} from '@nestjs/common';
import {pcWorldArray, World} from '../ps2alerts-constants/world';
import RabbitMQQueueFactory from '../modules/rabbitmq/factories/RabbitMQQueueFactory';
import {MetagameEventQueue} from '../modules/rabbitmq/queues/MetagameEventQueue';
import MetagameEventEventHandler from '../handlers/ps2census/MetagameEventEventHandler';
import {ConfigService} from '@nestjs/config';

@Injectable()
export default class MetagameSubscriber implements OnModuleInit {
    private static readonly logger = new Logger('MetagameSubscriber');
    private readonly queues = new Map<World, MetagameEventQueue>();
    private isConnected = false;

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        private readonly metagameEventHandler: MetagameEventEventHandler,
        private readonly config: ConfigService,
    ) {
    }

    public async onModuleInit(): Promise<void> {
        if (this.isConnected) {
            MetagameSubscriber.logger.error('Attempted to resubscribe to Metagame queues when already connected!');
            return;
        }

        MetagameSubscriber.logger.log('Creating world MetagameEvent queues...');

        // Subscribe only to worlds that make sense for the environment
        const censusEnv: string = this.config.get('census.environment');
        let worlds: World[] = censusEnv === 'ps2' ? pcWorldArray : censusEnv === 'ps2ps4us' ? [1000] : [2000];

        // Filter out Jaeger
        worlds = worlds.filter((world) => {
            return !(world === World.JAEGER);
        });

        // Registers queues by world and event type, enabling us to fine-tune the priorities of each queue and monitor for statistics.
        for (const world of worlds) {
            const queue = this.queueFactory.createMetagameEventQueue(
                `aggregator-${world}-MetagameEvent`,
                `${world}.MetagameEvent.*`,
                this.metagameEventHandler,
            );
            await queue.connect();

            this.queues.set(world, queue);
        }

        this.isConnected = true;

        MetagameSubscriber.logger.log('Successfully subscribed MetagameEvent queues!');
    }
}
