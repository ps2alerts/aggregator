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
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Phase} from '../ps2alerts-constants/outfitwars/phase';
import {Zone} from '../ps2alerts-constants/zone';

@injectable()
export default class AdminAggregatorMessageHandler implements QueueMessageHandlerInterface<AdminQueueMessage> {
    private static readonly logger = getLogger('AdminAggregatorMessageHandler');

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
            Ps2alertsEventState.STARTING,
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
        const round = time < new Date(2022, 8, 22) ? 1 // Qualifiers
            : time < new Date(2022, 8, 29) ? 2
            : time < new Date(2022, 9, 5) ? 3
            : time < new Date(2022, 9, 12) ? 4
            : time < new Date(2022, 9, 19) ? 5 // Playoff Ro8
            : time < new Date(2022, 9, 26) ? 6 // Playoff Ro4
            : 7; // Championship
        const phase = round < 5 ? Phase.QUALIFIERS
            : round < 7 ? Phase.PLAYOFFS
            : Phase.CHAMPIONSHIPS;

        const instance = new OutfitWarsTerritoryInstance(
            message.world,
            message.zone,
            message.zoneInstanceId,
            time,
            null,
            null,
            Ps2alertsEventState.STARTING,
            phase, // Change this to suit
            round, // Change this if you need it to match a particular ID
        );

        console.log('starting OW instance', instance);

        try {
            await this.instanceAuthority.startInstance(instance);
        } catch (err) {
            new ExceptionHandler(`Failed starting outfit wars instance "${instance.instanceId}" via adminAggregator message!`, err, 'AdminAggregatorMessageHandler.startOutfitwarsInstance');
        }

        return false;
    }
}
