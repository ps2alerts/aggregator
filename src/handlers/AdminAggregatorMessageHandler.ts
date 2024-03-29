/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// noinspection JSMethodCanBeStatic
import AdminQueueMessage from '../data/AdminAggregator/AdminQueueMessage';
import ApplicationException from '../exceptions/ApplicationException';
import {Injectable, Logger} from '@nestjs/common';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {metagameEventTypeDetailsMap} from '../ps2alerts-constants/metagameEventType';
import EventId from '../utils/eventId';
import InstanceAuthority from '../authorities/InstanceAuthority';
import {Ps2AlertsEventState} from '../ps2alerts-constants/ps2AlertsEventState';
import {jsonLogOutput} from '../utils/json';
import AdminAggregatorInstanceStartMessage from '../data/AdminAggregator/AdminAggregatorInstanceStartMessage';
import AdminAggregatorInstanceEndMessage from '../data/AdminAggregator/AdminAggregatorInstanceEndMessage';
import {Bracket} from '../ps2alerts-constants/bracket';
import {ChannelActionsInterface, QueueMessageHandlerInterface} from '../interfaces/QueueMessageHandlerInterface';
import ExceptionHandler from './system/ExceptionHandler';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Zone} from '../ps2alerts-constants/zone';
import {getOutfitWarPhase, getOutfitWarRound} from '../ps2alerts-constants/outfitwars/utils';

@Injectable()
export default class AdminAggregatorMessageHandler implements QueueMessageHandlerInterface<AdminQueueMessage> {
    private static readonly logger = new Logger('AdminAggregatorMessageHandler');

    constructor(private readonly instanceAuthority: InstanceAuthority) {}

    public async handle(event: AdminQueueMessage, actions: ChannelActionsInterface): Promise<void> {
        switch (event.action) {
            case 'start':
                return await this.startInstance(event, actions);
            case 'end':
                return await this.endInstance(event, actions);
            case 'endAll':
                return await this.endAllInstances(actions);
            case 'actives':
                return this.activeInstances(actions);
        }

        throw new ApplicationException(`Unknown AdminAggregator message received: ${jsonLogOutput(event)}`, 'AdminAggregatorMessageHandler');
    }

    // Collect the required information from the message in order to generate an PS2AlertsMetagameInstance, then trigger it.
    // This purposefully bypasses most of the restrictions of starting an instance in case of events or debugging.
    private async startInstance(message: AdminQueueMessage, actions: ChannelActionsInterface): Promise<void> {

        const adminAggregatorInstanceStart = new AdminAggregatorInstanceStartMessage(message.body);

        switch (adminAggregatorInstanceStart.type) {
            case 'territory':
                void await this.startTerritoryInstance(adminAggregatorInstanceStart);
                break;
            case 'outfitwars':
                void await this.startOutfitwarsInstance(adminAggregatorInstanceStart);
                break;
            default:
                throw new ApplicationException('Unknown instance type received!', 'AdminAggregatorMessageHandler');
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

    private async startTerritoryInstance(message: AdminAggregatorInstanceStartMessage): Promise<boolean> {
        const censusEventId = EventId.zoneFactionMeltdownToEventId(
            message.zone,
            message.faction,
            message.meltdown,
        );

        const metagameDetails = metagameEventTypeDetailsMap.get(censusEventId);

        if (!metagameDetails) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            AdminAggregatorMessageHandler.logger.error(`Zone: ${message.zone} - Faction: ${message.faction} - Meltdown: ${message.meltdown}`);

            throw new ApplicationException(`Unknown metagame event id ${censusEventId}`, 'AdminAggregatorMessageHandler.startTerritoryInstance');
        }

        const instance = new MetagameTerritoryInstance(
            message.world,
            message.zone,
            message.instanceId,
            new Date(),
            null,
            null,
            censusEventId,
            message.duration,
            Ps2AlertsEventState.STARTING,
            Bracket.UNKNOWN,
        );

        try {
            return await this.instanceAuthority.startInstance(instance);
        } catch (err) {
            new ExceptionHandler(`Failed starting instance ${instance.instanceId} via adminAggregator message!`, err, 'AdminAggregatorMessageHandler.startTerritoryInstance');
        }

        return false;
    }

    private async startOutfitwarsInstance(message: AdminAggregatorInstanceStartMessage): Promise<boolean> {
        if (message.zone !== Zone.NEXUS) {
            throw new ApplicationException('Attempted to start a outfit wars instance not on Nexus (zone 10)', 'AdminAggregatorMessageHandler.startOutfitwarsInstance');
        }

        if (!message.zoneInstanceId || message.zoneInstanceId === 0 || isNaN(message.zoneInstanceId)) {
            throw new ApplicationException('Zone Instance ID was not valid!', 'AdminAggregatorMessageHandler.startOutfitwarsInstance');
        }

        const time = new Date();
        const round = getOutfitWarRound(time);
        const phase = getOutfitWarPhase(round);

        const instance = new OutfitWarsTerritoryInstance(
            message.world,
            message.zone,
            message.zoneInstanceId,
            message.instanceId,
            time,
            null,
            null,
            Ps2AlertsEventState.STARTING,
            {phase, round},
        );

        AdminAggregatorMessageHandler.logger.log('Starting Outfit Wars instance', instance);

        try {
            await this.instanceAuthority.startInstance(instance);
        } catch (err) {
            new ExceptionHandler(`Failed starting outfit wars instance "${instance.instanceId}" via adminAggregator message!`, err, 'AdminAggregatorMessageHandler.startOutfitwarsInstance');
        }

        return false;
    }
}
