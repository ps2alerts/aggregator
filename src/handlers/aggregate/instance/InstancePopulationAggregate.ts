import {injectable} from 'inversify';
import {getLogger} from '../../../logger';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import PopulationData from '../../../data/PopulationData';
import InstanceAuthority from '../../../authorities/InstanceAuthority';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import CharacterPresenceHandler from '../../CharacterPresenceHandler';

@injectable()
export default class InstancePopulationAggregate implements AggregateHandlerInterface<PopulationData>{
    private static readonly logger = getLogger('InstancePopulationAggregate');

    constructor(
        private readonly characterPresenceHandler: CharacterPresenceHandler,
        private readonly instanceAuthority: InstanceAuthority,
        private readonly apiMQPublisher: ApiMQPublisher,
    ) {}

    public async handle(event: PopulationData): Promise<boolean> {
        InstancePopulationAggregate.logger.silly('InstancePopulationAggregate.handle');

        // Figure out running instances and generate new InstancePopulationData object
        const activeInstances = this.instanceAuthority.getInstances(event.world, event.zone);

        // If no instances running, bail.
        if (activeInstances.length === 0) {
            return true;
        }

        // Whatever keeps you happy ESLint
        const documents: Array<{ instance: string, timestamp: Date, vs: number, nc: number, tr: number, nso: number, total: number }> = [];

        activeInstances.forEach((instance) => {
            // Check if instances match data
            documents.push({
                instance: instance.instanceId,
                timestamp: new Date(),
                vs: event.vs,
                nc: event.nc,
                tr: event.tr,
                nso: event.nso,
                total: event.total,
            });
        });

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_POPULATION_AGGREGATE,
                documents,
            ));
        } catch (err) {
            if (err instanceof Error) {
                InstancePopulationAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
