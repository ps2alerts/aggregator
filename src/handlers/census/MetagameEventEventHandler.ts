import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import MetagameEventEvent from './events/MetagameEventEvent';
import {TYPES} from '../../constants/types';
import InstanceHandlerInterface from '../../interfaces/InstanceHandlerInterface';
import ApplicationException from '../../exceptions/ApplicationException';
import {MetagameEventState} from '../../constants/metagameEventState';
import {metagameEventTypeDetailsMap} from '../../constants/metagameEventType';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';
import {Ps2alertsEventState} from '../../constants/ps2alertsEventState';
import TerritoryCalculatorFactory from '../../factories/TerritoryCalculatorFactory';

@injectable()
export default class MetagameEventEventHandler implements EventHandlerInterface<MetagameEventEvent> {
    private static readonly logger = getLogger('MetagameEventEventHandler');
    private readonly instanceHandler: InstanceHandlerInterface;
    private readonly territoryCalculatorFactory: TerritoryCalculatorFactory;

    constructor(
    @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.territoryCalculatorFactory) territoryCalculatorFactory: TerritoryCalculatorFactory,
    ) {
        this.instanceHandler = instanceHandler;
        this.territoryCalculatorFactory = territoryCalculatorFactory;
    }

    public async handle(event: MetagameEventEvent): Promise<boolean> {
        MetagameEventEventHandler.logger.debug('Parsing MetagameEventEvent message...');

        if (config.features.logging.censusEventContent.metagame) {
            MetagameEventEventHandler.logger.info(jsonLogOutput(event), {message: 'eventData'});
        }

        const instances = this.instanceHandler.getInstances(event.world, event.zone);

        if (event.eventState === MetagameEventState.STARTED) {
            if (instances.length > 1) {
                throw new ApplicationException(`Multiple instances detected when there should only be one! \r\n${jsonLogOutput(event)}`, 'InstanceHandler');
            }

            if (instances.length > 0) {
                this.instanceHandler.printActives();
                MetagameEventEventHandler.logger.error(`Instance already exists: ${jsonLogOutput(event)}`);
                return false;
            }

            const metagameDetails = metagameEventTypeDetailsMap.get(event.eventType);

            if (!metagameDetails) {
                throw new ApplicationException(`Unknown metagame event id ${event.eventType}`);
            }

            const instance = new MetagameTerritoryInstance(
                event.world,
                event.timestamp,
                null,
                null,
                metagameDetails.zone,
                event.instanceId,
                event.eventType,
                metagameDetails.duration,
                Ps2alertsEventState.STARTED,
            );

            // Chicken and egg scenario, can't use the instance if it doesn't exist yet!
            instance.result = await this.territoryCalculatorFactory.build(instance).calculate();

            try {
                return await this.instanceHandler.startInstance(instance);
            } catch (e) {
                if (e instanceof Error) {
                    MetagameEventEventHandler.logger.error(`Error parsing MetagameEvent: ${e.message}\r\n${jsonLogOutput(event)}`);
                } else {
                    MetagameEventEventHandler.logger.error('UNEXPECTED ERROR parsing MetagameEvent!');
                }

                return false;
            }
        }

        if (event.eventState === MetagameEventState.FINISHED) {
            if (instances[0]) {
                return await this.instanceHandler.endInstance(instances[0]);
            } else {
                MetagameEventEventHandler.logger.error(`Instance not found: ${jsonLogOutput(event)}`);
                return false;
            }
        }

        throw new ApplicationException('Unhandled execution path', 'MetagameEventEventHandler');
    }
}
