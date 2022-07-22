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
import ExceptionHandler from './system/ExceptionHandler';

@injectable()
export default class AdminAggregatorMessageHandler implements QueueMessageHandlerInterface<AdminQueueMessage> {
    private static readonly logger = getLogger('AdminAggregatorMessageHandler');

    constructor(private readonly instanceAuthority: InstanceAuthority) {}

    public async handle(event: AdminQueueMessage, actions: ChannelActionsInterface): Promise<void> {
        switch (event.type) {
            case 'instanceStart':
                return await this.startInstance(event, actions);
            case 'instanceEnd':
                return await this.endInstance(event, actions);
            case 'endAll':
                return await this.endAllInstances(actions);
            case 'activeInstances':
                return this.activeInstances(actions);
        }

        throw new ApplicationException(`Unknown AdminAggregator message received: ${jsonLogOutput(event)}`, 'AdminAggregatorMessageHandler');
    }

    // Collect the required information from the message in order to generate an PS2AlertsMetagameInstance, then trigger it.
    // This purposefully bypasses most of the restrictions of starting an instance in case of events or debugging.
    private async startInstance(message: AdminQueueMessage, actions: ChannelActionsInterface): Promise<void> {
        const adminAggregatorInstanceStart = new AdminAggregatorInstanceStartMessage(message.body);

        const censusEventId = EventId.zoneFactionMeltdownToEventId(
            adminAggregatorInstanceStart.zone,
            adminAggregatorInstanceStart.faction,
            adminAggregatorInstanceStart.meltdown,
        );

        const metagameDetails = metagameEventTypeDetailsMap.get(censusEventId);

        if (!metagameDetails) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            AdminAggregatorMessageHandler.logger.error(`Zone: ${adminAggregatorInstanceStart.zone} - Faction: ${adminAggregatorInstanceStart.faction} - Meltdown: ${adminAggregatorInstanceStart.meltdown}`);

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
            new ExceptionHandler(`Failed starting instance #${instance.world}-${instance.censusInstanceId} via adminAggregator message!`, err, 'AdminAggregatorMessageHandler.startInstance');
        }

        actions.ack();
    }

    private async endInstance(message: AdminQueueMessage, actions: ChannelActionsInterface): Promise<void> {
        const aggregatorMessage = new AdminAggregatorInstanceEndMessage(message.body);

        try {
            const instance = this.instanceAuthority.getInstance(aggregatorMessage.instanceId);

            if (!instance) {
                // While normally we would throw an exception here, it is not possible due to the containing .map call from AdminAggregatorMessageHandler.
                AdminAggregatorMessageHandler.logger.error(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message! No instance found!`);
                return;
            }

            await this.instanceAuthority.endInstance(instance);
            actions.ack();
        } catch (err) {
            actions.ack();
            new ExceptionHandler(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message!`, err, 'AdminAggregatorMessageHandler.startInstance');
        }
    }

    private async endAllInstances(actions: ChannelActionsInterface): Promise<void> {
        try {
            const instances = this.instanceAuthority.getAllInstances();

            if (instances.length === 0) {
                // While normally we would throw an exception here, it is not possible due to the containing .map call from AdminAggregatorMessageHandler.
                throw new ApplicationException('No instances found to end!');
            }

            for (const instance of instances) {
                await this.instanceAuthority.endInstance(instance);
            }
        } catch (err) {
            new ExceptionHandler('Failed ending all instances via adminAggregator message!', err, 'AdminAggregatorMessageHandler.endAllInstances');
        }

        actions.ack();
    }

    private activeInstances(actions: ChannelActionsInterface): void {
        this.instanceAuthority.printActives();
        actions.ack();
    }
}
