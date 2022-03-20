import {getLogger} from '../logger';
import {injectable, multiInject} from 'inversify';
import {TYPES} from '../constants/types';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import {jsonLogOutput} from '../utils/json';
import PopulationData from '../data/PopulationData';

@injectable()
export default class PopulationHandler implements PopulationHandlerInterface<PopulationData> {
    private static readonly logger = getLogger('PopulationHandler');

    constructor(@multiInject(TYPES.populationAggregates) private readonly aggregateHandlers: Array<PopulationHandlerInterface<PopulationData>>) {}

    public async handle(event: PopulationData): Promise<boolean> {
        PopulationHandler.logger.silly(jsonLogOutput(event), {message: 'eventData'});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const promises: Array<Promise<any>> = [];

        this.aggregateHandlers.map(
            (handler: PopulationHandlerInterface<PopulationData>) => promises.push(handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        PopulationHandler.logger.error(`Error parsing AggregateHandlers for PopulationHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        PopulationHandler.logger.error('UNEXPECTED ERROR parsing PopulationHandler AggregateHandlers!');
                    }

                    return false;
                }),
            ),
        );

        await Promise.all(promises);

        return true;
    }
}
