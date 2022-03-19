import {MessageQueueHandlerInterface} from '../../interfaces/MessageQueueHandlerInterface';
import ParsedQueueMessage from '../../data/ParsedQueueMessage';
import ApplicationException from '../../exceptions/ApplicationException';
import {TYPES} from '../../constants/types';
import {inject, injectable} from 'inversify';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';
import {metagameEventTypeDetailsMap} from '../../constants/metagameEventType';
import EventId from '../../utils/eventId';
import InstanceAuthority from '../../authorities/InstanceAuthority';
import {Ps2alertsEventState} from '../../constants/ps2alertsEventState';
import AdminAggregatorInstanceStartMessage from '../../data/AdminAggregator/AdminAggregatorInstanceStartMessage';
import {getLogger} from '../../logger';
import {jsonLogOutput} from '../../utils/json';
import AdminAggregatorInstanceEndMessage from '../../data/AdminAggregator/AdminAggregatorInstanceEndMessage';
import TerritoryCalculatorFactory from '../../factories/TerritoryCalculatorFactory';
import {getCensusEnvironment} from '../../utils/CensusEnvironment';

@injectable()
export default class AdminAggregatorMessageHandler implements MessageQueueHandlerInterface<ParsedQueueMessage> {
    private static readonly logger = getLogger('AdminAggregatorMessageHandler');
    private readonly instanceAuthority: InstanceAuthority;
    private readonly territoryCalculatorFactory: TerritoryCalculatorFactory;

    constructor(
    instanceAuthority: InstanceAuthority,
        @inject(TYPES.territoryCalculatorFactory) territoryCalculatorFactory: TerritoryCalculatorFactory,
    ) {
        this.instanceAuthority = instanceAuthority;
        this.territoryCalculatorFactory = territoryCalculatorFactory;
    }

    public async handle(message: ParsedQueueMessage): Promise<boolean> {
        switch (message.type) {
            case 'instanceStart':
                return await this.startInstance(message);
            case 'instanceEnd':
                return await this.endInstance(message);
            case 'endAll':
                return await this.endAllInstances();
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

        const instance = new MetagameTerritoryInstance(
            adminAggregatorInstanceStart.world,
            new Date(),
            null,
            null,
            adminAggregatorInstanceStart.zone,
            adminAggregatorInstanceStart.instanceId,
            censusEventId,
            adminAggregatorInstanceStart.duration,
            Ps2alertsEventState.STARTED,
        );

        try {
            return await this.instanceAuthority.startInstance(instance, getCensusEnvironment(instance.world));
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorMessageHandler.logger.error(`Failed starting instance #${instance.world}-${instance.censusInstanceId} via adminAggregator message! Error: ${err.message}. Retrying...`);
            }

            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            setTimeout(async () => {
                try {
                    return await this.instanceAuthority.startInstance(instance, getCensusEnvironment(instance.world));
                } catch (err) {
                    if (err instanceof Error) {
                        // While normally we would throw an exception here, it is not possible due to the containing .map call from AdminAggregatorSubscriber.
                        AdminAggregatorMessageHandler.logger.error(`Failed starting instance #${instance.world}-${instance.censusInstanceId} via adminAggregator message (2nd try)! Error: ${err.message}.`);
                    }
                }
            }, 5000);
        }

        return false;
    }

    private async endInstance(message: ParsedQueueMessage): Promise<boolean> {
        const aggregatorMessage = new AdminAggregatorInstanceEndMessage(message.body);

        try {
            const instance = this.instanceAuthority.getInstance(aggregatorMessage.instanceId);

            if (!instance) {
                // While normally we would throw an exception here, it is not possible due to the containing .map call from AdminAggregatorSubscriber.
                AdminAggregatorMessageHandler.logger.error(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message! No instance found!`);
                return false;
            }

            return await this.instanceAuthority.endInstance(instance, getCensusEnvironment(instance.world));
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorMessageHandler.logger.error(`Failed ending instance #${aggregatorMessage.instanceId} via adminAggregator message! E: ${err.message}`);
            }
        }

        return false;
    }

    private async endAllInstances(): Promise<boolean> {
        try {
            const instances = this.instanceAuthority.getAllInstances();

            if (instances.length === 0) {
                // While normally we would throw an exception here, it is not possible due to the containing .map call from AdminAggregatorSubscriber.
                AdminAggregatorMessageHandler.logger.error('No instances found to end!');
                return false;
            }

            for (const instance of instances) {
                await this.instanceAuthority.endInstance(instance, getCensusEnvironment(instance.world));
            }

            return true;
        } catch (err) {
            if (err instanceof Error) {
                AdminAggregatorMessageHandler.logger.error(`Failed ending all instances via adminAggregator message! E: ${err.message}`);
            }
        }

        return false;
    }

    private activeInstances(): void {
        return this.instanceAuthority.printActives();
    }
}
