// noinspection JSMethodCanBeStatic

import AdminQueueMessage from '../data/AdminAggregator/AdminQueueMessage';
import ApplicationException from '../exceptions/ApplicationException';
import {injectable} from 'inversify';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {metagameEventTypeDetailsMap} from '../ps2alerts-constants/metagameEventType';
import EventId from '../utils/eventId';
import InstanceAuthority from '../authorities/InstanceAuthority';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {getLogger} from '../logger';
import {jsonLogOutput} from '../utils/json';
import AdminAggregatorInstanceStartMessage from '../data/AdminAggregator/AdminAggregatorInstanceStartMessage';
import AdminAggregatorInstanceEndMessage from '../data/AdminAggregator/AdminAggregatorInstanceEndMessage';
import {Bracket} from '../ps2alerts-constants/bracket';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import {ConsumeMessage} from 'amqplib';

@injectable()
export default class AdminAggregatorMessageHandler implements QueueMessageHandlerInterface<ConsumeMessage> {
    private static readonly logger = getLogger('AdminAggregatorMessageHandler');

    constructor(private readonly instanceAuthority: InstanceAuthority) {}

    public async handle(msg: ConsumeMessage, actions: ChannelActionsInterface): Promise<void> {
        const queueName = 'AdminQueue';
        let adminQueueMessage: AdminQueueMessage;

        if (!msg) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            AdminAggregatorMessageHandler.logger.error(`[${queueName}] Got empty message!`);
            return;
        }

        try {
            adminQueueMessage = this.parseMessage(msg, queueName);
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorMessageHandler.logger.error(`[${queueName}] Unable to handle message! Probably invalid format. E: ${err.message}`);
            }

            actions.ack();
            AdminAggregatorMessageHandler.logger.debug(`Acked failed message for ${queueName}`);
            return;
        }

        switch (adminQueueMessage.type) {
            case 'instanceStart':
                return await this.startInstance(adminQueueMessage);
            case 'instanceEnd':
                return await this.endInstance(adminQueueMessage);
            case 'endAll':
                return await this.endAllInstances();
            case 'activeInstances':
                return void this.activeInstances();
        }

        throw new ApplicationException(`Unknown AdminAggregator message received: ${jsonLogOutput(adminQueueMessage)}`, 'AdminAggregatorMessageHandler');
    }

    private parseMessage(
        msg: ConsumeMessage,
        queueName: string,
    ): AdminQueueMessage {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: {type: string, body: any};

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data = JSON.parse(msg.content.toString());
        } catch (e) {
            throw new ApplicationException(`[${queueName}] Unable to JSON parse message! Message: "${msg.content.toString()}"`, 'AdminAggregatorSubscriber.parseMessage');
        }

        if (!data.type) {
            throw new ApplicationException(`[${queueName}] Missing message body! ${jsonLogOutput(data)}`, 'AdminAggregatorSubscriber.parseMessage');
        }

        if (!data.body) {
            throw new ApplicationException(`[${queueName}] Missing message body! ${jsonLogOutput(data)}`, 'AdminAggregatorSubscriber.parseMessage');
        }

        AdminAggregatorMessageHandler.logger.info(`[${queueName}] successfully parsed message! ${jsonLogOutput(data)}`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return new AdminQueueMessage(data.type, data.body);
    }

    // Collect the required information from the message in order to generate an PS2AlertsMetagameInstance, then trigger it.
    private async startInstance(message: AdminQueueMessage): Promise<void> {
        const adminAggregatorInstanceStart = new AdminAggregatorInstanceStartMessage(message.body);

        const censusEventId = EventId.zoneFactionMeltdownToEventId(
            adminAggregatorInstanceStart.zone,
            adminAggregatorInstanceStart.faction,
            adminAggregatorInstanceStart.meltdown,
        );

        const metagameDetails = metagameEventTypeDetailsMap.get(censusEventId);

        if (!metagameDetails) {
            throw new ApplicationException(`Unknown metagame event id ${censusEventId}`, 'AdminAggregatorMessageHandler');
        }

        const instance = new MetagameTerritoryInstance(
            adminAggregatorInstanceStart.world,
            new Date(),
            null,
            null,
            adminAggregatorInstanceStart.zone,
            adminAggregatorInstanceStart.instanceId,
            censusEventId,
            adminAggregatorInstanceStart.duration,
            Ps2alertsEventState.STARTING,
            Bracket.UNKNOWN,
        );

        try {
            await this.instanceAuthority.startInstance(instance);
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorMessageHandler.logger.error(`Failed starting instance #${instance.world}-${instance.censusInstanceId} via adminAggregator message! Error: ${err.message}. Retrying...`);
            }
        }
    }

    private async endInstance(message: AdminQueueMessage): Promise<void> {
        const aggregatorMessage = new AdminAggregatorInstanceEndMessage(message.body);

        try {
            const instance = this.instanceAuthority.getInstance(aggregatorMessage.instanceId);

            if (!instance) {
                // While normally we would throw an exception here, it is not possible due to the containing .map call from AdminAggregatorMessageHandler.
                AdminAggregatorMessageHandler.logger.error(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message! No instance found!`);
                return;
            }

            await this.instanceAuthority.endInstance(instance);
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorMessageHandler.logger.error(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message! E: ${err.message}`);
            }
        }
    }

    private async endAllInstances(): Promise<void> {
        try {
            const instances = this.instanceAuthority.getAllInstances();

            if (instances.length === 0) {
                // While normally we would throw an exception here, it is not possible due to the containing .map call from AdminAggregatorMessageHandler.
                AdminAggregatorMessageHandler.logger.error('No instances found to end!');
                return;
            }

            for (const instance of instances) {
                await this.instanceAuthority.endInstance(instance);
            }
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorMessageHandler.logger.error(`Failed ending all instances via adminAggregator message! E: ${err.message}`);
            }
        }
    }

    private activeInstances(): void {
        return this.instanceAuthority.printActives();
    }
}
