import {getLogger} from '../logger';
import {multiInject} from 'inversify';
import {TYPES} from '../constants/types';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import config from '../config';
import {jsonLogOutput} from '../utils/json';
import PopulationData from '../data/PopulationData';

export default class PopulationHandler implements PopulationHandlerInterface<PopulationData> {
    private static readonly logger = getLogger('PopulationHandler');

    private readonly aggregateHandlers: Array<PopulationHandlerInterface<PopulationData>>;

    constructor(
    @multiInject(TYPES.populationAggregates) populationAggregates: Array<PopulationHandlerInterface<PopulationData>>,
    ) {
        this.aggregateHandlers = populationAggregates;
    }

    public handle(event: PopulationData): Promise<boolean> {
        if (config.features.logging.censusEventContent.deaths) {
            PopulationHandler.logger.debug(jsonLogOutput(event), {message: 'eventData'});
        }

        this.aggregateHandlers.map(
            (handler: PopulationHandlerInterface<PopulationData>) => void handler.handle(event)
                .catch((e) => {
                    if (e instanceof Error) {
                        PopulationHandler.logger.error(`Error parsing AggregateHandlers for PopulationHandler: ${e.message}\r\n${jsonLogOutput(event)}`);
                    } else {
                        PopulationHandler.logger.error('UNEXPECTED ERROR parsing PopulationHandler AggregateHandlers!');
                    }

                    return false;
                }),
        );

        return true;
    }
}
