import PlayerHandlerInterface from '../../../interfaces/PlayerHandlerInterface';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {InstancePopulationAggregateSchemaInterface} from '../../../models/aggregate/instance/InstancePopulationAggregateModel';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {getLogger} from '../../../logger';
import InstancePopulationData from '../../../data/InstancePopulationData';
import ApplicationException from '../../../exceptions/ApplicationException';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';

@injectable()
export default class InstancePopulationAggregate implements AggregateHandlerInterface<InstancePopulationData>{
    private static readonly logger = getLogger('InstancePopulationAggregate');

    private readonly playerHandler: PlayerHandlerInterface;

    private readonly factory: MongooseModelFactory<InstancePopulationAggregateSchemaInterface>;

    constructor(@inject(TYPES.playerHandlerInterface) playerHandler: PlayerHandlerInterface) {
        this.playerHandler = playerHandler;
    }

    public async handle(event: InstancePopulationData): Promise<boolean> {
        InstancePopulationAggregate.logger.debug('InstancePopulationAggregate.handle');

        const data = {
            instance: event.instance.instanceId,
            timestamp: event.timestamp,
            vsPop: event.vsPop,
            ncPop: event.ncPop,
            trPop: event.trPop,
            nsoPop: event.nsoPop,
            totalPop: event.totalPop,
        };

        try {
            await this.factory.model.create(data);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert initial InstanceWeaponAggregate record into DB! ${err}`, 'InstanceWeaponAggregate');
            }
        }

        return false;
    }
}
