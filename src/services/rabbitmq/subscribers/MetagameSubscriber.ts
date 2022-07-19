// noinspection JSMethodCanBeStatic

import {injectable} from 'inversify';
import {getLogger} from '../../../logger';
import {pcWorldArray, World} from '../../../ps2alerts-constants/world';
import config from '../../../config';
import {RabbitMQQueueWrapperInterface} from '../../../interfaces/RabbitMQQueueWrapperInterface';
import RabbitMQQueueFactory from '../../../factories/RabbitMQQueueFactory';
import {MetagameEventQueue} from '../queues/MetagameEventQueue';
import MetagameEventEventHandler from '../../../handlers/ps2census/MetagameEventEventHandler';

@injectable()
export default class MetagameSubscriber implements RabbitMQQueueWrapperInterface {
    private static readonly logger = getLogger('MetagameSubscriber');
    private readonly queues = new Map<World, MetagameEventQueue>();
    private isConnected = false;

    constructor(
        private readonly queueFactory: RabbitMQQueueFactory,
        private readonly metagameEventHandler: MetagameEventEventHandler,
    ) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async connect(): Promise<void> {
        if (this.isConnected) {
            MetagameSubscriber.logger.error('Attempted to resubscribe to Metagame queues when already connected!');
            return;
        }

        if (!config.census.metagameQueuesEnabled) {
            MetagameSubscriber.logger.info('MetagameEvent queue creation is disabled. Not creating / subscribing to queues.');
            return;
        }

        MetagameSubscriber.logger.info('Creating world MetagameEvent queues...');

        // Subscribe only to worlds that make sense for the environment
        const censusEnv = config.census.censusEnvironment;
        let worlds: World[] = censusEnv === 'ps2' ? pcWorldArray : censusEnv === 'ps2ps4us' ? [1000] : [2000];

        // Filter out Jaeger and SolTech (SolTech is heavily broken atm)
        worlds = worlds.filter((world) => {
            return !(world === World.JAEGER || world === World.SOLTECH);
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

        MetagameSubscriber.logger.info('Successfully subscribed MetagameEvent queues!');
    }
}
