import CharacterPresenceHandlerInterface from '../../../interfaces/CharacterPresenceHandlerInterface';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {InstancePopulationAggregateSchemaInterface} from '../../../models/aggregate/instance/InstancePopulationAggregateModel';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {getLogger} from '../../../logger';
import ApplicationException from '../../../exceptions/ApplicationException';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import PopulationData from '../../../data/PopulationData';
import InstanceHandlerInterface from '../../../interfaces/InstanceHandlerInterface';

@injectable()
export default class InstancePopulationAggregate implements AggregateHandlerInterface<PopulationData>{
    private static readonly logger = getLogger('InstancePopulationAggregate');

    private readonly playerHandler: CharacterPresenceHandlerInterface;

    private readonly factory: MongooseModelFactory<InstancePopulationAggregateSchemaInterface>;

    private readonly instanceHandler: InstanceHandlerInterface;

    constructor(
    @inject(TYPES.characterPresenceHandlerInterface) playerHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.instancePopulationAggregateFactory) factory: MongooseModelFactory<InstancePopulationAggregateSchemaInterface>) {
        this.playerHandler = playerHandler;
        this.instanceHandler = instanceHandler;
        this.factory = factory;
    }

    public async handle(event: PopulationData): Promise<boolean> {
        InstancePopulationAggregate.logger.debug('InstancePopulationAggregate.handle');

        // Figure out running instances and generate new InstancePopulationData object
        const activeInstances = this.instanceHandler.getAllInstances().filter((instance) => {
            return instance.match(event.world, event.zone);
        });

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const promises: Array<Promise<any>> = [];

        documents.forEach((doc) => {
            const promise = this.factory.model.create(doc)
                .catch((err) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const error: Error = err;

                    if (!error.message.includes('E11000')) {
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        throw new ApplicationException(`Unable to insert initial InstancePopulationAggregate record into DB! ${err}`, 'InstancePopulationAggregate');
                    }
                });
            promises.push(promise);
        });

        await Promise.all(promises);

        return true;
    }
}
