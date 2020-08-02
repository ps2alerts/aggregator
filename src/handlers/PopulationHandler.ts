import {getLogger} from '../logger';
import {multiInject} from 'inversify';
import {TYPES} from '../constants/types';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import InstancePopulationData from '../data/InstancePopulationData';
import config from '../config';
import {jsonLogOutput} from '../utils/json';

export default class PopulationHandler implements PopulationHandlerInterface<InstancePopulationData> {
    private static readonly logger = getLogger('PopulationHandler');

    private readonly aggregateHandlers: Array<PopulationHandlerInterface<InstancePopulationData>>;

    constructor(
    @multiInject(TYPES.populationAggregates) populationAggregates: Array<PopulationHandlerInterface<InstancePopulationData>>,
    ) {
        this.aggregateHandlers = populationAggregates;
    }

    public handle(event: InstancePopulationData): Promise<boolean> {
        if (config.features.logging.censusEventContent.deaths) {
            PopulationHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        this.aggregateHandlers.map(
            (handler: PopulationHandlerInterface<InstancePopulationData>) => void handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        PopulationHandler.logger.error(`Error parsing AggregateHandlers for PopulationHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        PopulationHandler.logger.error('UNEXPECTED ERROR parsing PopulationHandler AggregateHandlers!');
                    }
                }),
        );

        return true;
    }
}
