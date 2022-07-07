// noinspection JSMethodCanBeStatic

import {inject, injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {getLogger} from '../../../logger';
import {TYPES} from '../../../constants/types';
import {World} from '../../../ps2alerts-constants/world';
import {WorldQueue} from './WorldQueue';
import {CensusClient} from 'ps2census';
import Ps2censusMessageHandler from '../../../handlers/ps2census/Ps2censusMessageHandler';

@injectable()
export default class WorldSubscriber {
    private static readonly logger = getLogger('WorldSubscriber');
    private readonly connectedWorlds: World[] = [];
    private worldQueues: WorldQueue[] = [];

    constructor(
        @inject(TYPES.rabbitMqConnectionHandlerFactory) private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory,
        private readonly censusClient: CensusClient,
        private readonly messageHandler: Ps2censusMessageHandler,
    ) {}

    public async connect(world: World): Promise<boolean> {
        if (this.connectedWorlds.includes(world)) {
            WorldSubscriber.logger.error(`We are already subscribed to world ${world}! It's dangerous to re-subscribe so, no.`);
            return false;
        }

        // If a message type isn't defined here, it won't be collected!
        const queueNames = [
            `${world}-Death`,
            `${world}-GainExperience`,
            `${world}-FacilityControl`,
            `${world}-PlayerFacilityCapture`,
            `${world}-PlayerFacilityDefend`,
            `${world}-MetagameEvent`,
            `${world}-VehicleDestroy`,
        ];

        WorldSubscriber.logger.info('Creating world queues...');

        // Registers queues by world and event type, enabling us to fine-tune the priorities of each queue and monitor for statistics.
        for (const queue of queueNames) {
            const eventName = queue.split('-')[1];
            const worldQueue = new WorldQueue(
                this.connectionHandlerFactory,
                this.censusClient,
                this.messageHandler,
            );
            await worldQueue.connect(world, eventName);
            this.worldQueues.push(worldQueue);
        }

        this.connectedWorlds.push(world);

        WorldSubscriber.logger.info(`Successfully subscribed queues to world ${world}!`);

        return true;
    }

    public async disconnect(world: World): Promise<void> {
        WorldSubscriber.logger.info(`Disconnecting queues from world ${world}...`);
        WorldSubscriber.logger.debug(`Current number of queues active: ${this.worldQueues.length}`);

        for (const queue of this.worldQueues) {
            if (queue.getWorld() === world) {
                await queue.disconnect();
            }
        }

        // Removed disconnected worldQueues out of the array (and hopefully memory)
        this.worldQueues = this.worldQueues.filter((queue) => {
            return queue.isConnected();
        });

        WorldSubscriber.logger.debug(`New number of queues active: ${this.worldQueues.length}`);

    }
}
