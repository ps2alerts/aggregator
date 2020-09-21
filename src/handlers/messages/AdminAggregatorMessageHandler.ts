import {MessageQueueHandlerInterface} from '../../interfaces/MessageQueueHandlerInterface';
import ParsedQueueMessage from '../../data/ParsedQueueMessage';
import ApplicationException from '../../exceptions/ApplicationException';
import {TYPES} from '../../constants/types';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
import {inject, injectable} from 'inversify';
import PS2AlertsMetagameInstance from '../../instances/PS2AlertsMetagameInstance';
import {metagameEventTypeDetailsMap} from '../../constants/metagameEventType';
import EventId from '../../utils/eventId';
import {Ps2alertsEventState} from '../../constants/ps2alertsEventState';
import AdminAggregatorInstanceStartMessage from '../../data/AdminAggregator/AdminAggregatorInstanceStartMessage';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import AdminAggregatorInstanceEndMessage from '../../data/AdminAggregator/AdminAggregatorInstanceEndMessage';

@injectable()
export default class AdminAggregatorMessageHandler implements MessageQueueHandlerInterface<ParsedQueueMessage> {
    private static readonly logger = getLogger('AdminAggregatorMessageHandler');

    private readonly instanceHandler: InstanceHandlerInterface;

    constructor(@inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface) {
        this.instanceHandler = instanceHandler;

    }
    public async handle(message: ParsedQueueMessage): Promise<boolean> {
        switch (message.type) {
            case 'instanceStart':
                return await this.startInstance(message);
            case 'instanceEnd':
                return await this.endInstance(message);
            case 'activeInstances':
                void this.activeInstances();
                return true;
        }

        throw new ApplicationException(`Unknown AdminAggregator message received: ${jsonLogOutput(message)}`, 'AdminAggregatorMessageHandler');
    }

    // Collect the required information from the message in order to generate an PS2AlertsMetagameInstance, then trigger it.
    private async startInstance(message: ParsedQueueMessage): Promise<boolean> {
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

        const instance = new PS2AlertsMetagameInstance(
            adminAggregatorInstanceStart.world,
            new Date(),
            null,
            adminAggregatorInstanceStart.zone,
            adminAggregatorInstanceStart.instanceId,
            censusEventId,
            adminAggregatorInstanceStart.duration,
            Ps2alertsEventState.STARTED,
        );

        try {
            return this.instanceHandler.startInstance(instance);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            AdminAggregatorMessageHandler.logger.error(`Failed starting instance #${instance.world}-${instance.censusInstanceId} via adminAggregator message! Error: ${e.message}`);
        }

        return false;
    }

    private async endInstance(message: ParsedQueueMessage): Promise<boolean> {
        const aggregatorMessage = new AdminAggregatorInstanceEndMessage(message.body);
        const instance = this.instanceHandler.getInstance(aggregatorMessage.instanceId);

        if (!instance) {
            AdminAggregatorMessageHandler.logger.error(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message! No instance found!`);
        }

        try {
            return await this.instanceHandler.endInstance(instance);
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            AdminAggregatorMessageHandler.logger.error(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message! Error: ${e.message}`);
        }

        return false;
    }

    private activeInstances(): void {
        return this.instanceHandler.printActives();
    }
}
