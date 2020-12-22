import {inject, injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import {getLogger} from '../../logger';
import config from '../../config';
import {jsonLogOutput} from '../../utils/json';
import MetagameEventEvent from './events/MetagameEventEvent';
import {TYPES} from '../../constants/types';
import ApplicationException from '../../exceptions/ApplicationException';
import {MetagameEventState} from '../../constants/metagameEventState';
import {metagameEventTypeDetailsMap} from '../../constants/metagameEventType';
import MetagameTerritoryInstance from '../../instances/MetagameTerritoryInstance';
import {Ps2alertsEventState} from '../../constants/ps2alertsEventState';
import TerritoryCalculatorFactory from '../../factories/TerritoryCalculatorFactory';
import InstanceAuthority from '../../authorities/InstanceAuthority';
import {CensusEnvironment} from '../../types/CensusEnvironment';

@injectable()
export default class MetagameEventEventHandler implements EventHandlerInterface<MetagameEventEvent> {
    private static readonly logger = getLogger('MetagameEventEventHandler');
    private readonly instanceAuthority: InstanceAuthority;
    private readonly territoryCalculatorFactory: TerritoryCalculatorFactory;

    constructor(
    @inject(TYPES.instanceAuthority) instanceAuthority: InstanceAuthority,
        @inject(TYPES.territoryCalculatorFactory) territoryCalculatorFactory: TerritoryCalculatorFactory,
    ) {
        this.instanceAuthority = instanceAuthority;
        this.territoryCalculatorFactory = territoryCalculatorFactory;
    }

    public async handle(event: MetagameEventEvent, environment: CensusEnvironment): Promise<boolean> {
        MetagameEventEventHandler.logger.debug('Parsing MetagameEventEvent message...');

        if (config.features.logging.censusEventContent.metagame) {
            MetagameEventEventHandler.logger.info(jsonLogOutput(event), {message: 'eventData'});
        }

        const instances = this.instanceAuthority.getInstances(event.world, event.zone);

        if (event.eventState === MetagameEventState.STARTED) {
            if (instances.length > 1) {
                throw new ApplicationException(`Multiple instances detected when there should only be one! \r\n${jsonLogOutput(event)}`, 'MetagameEventEventHandler');
            }

            if (instances.length > 0) {
                this.instanceAuthority.printActives();
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

            try {
                return await this.instanceAuthority.startInstance(instance, environment);
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
                return await this.instanceAuthority.endInstance(instances[0], environment);
            } else {
                MetagameEventEventHandler.logger.error(`Instance not found: ${jsonLogOutput(event)}`);
                return false;
            }
        }

        throw new ApplicationException('Unhandled execution path', 'MetagameEventEventHandler');
    }
}
