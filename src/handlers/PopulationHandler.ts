import {Inject, Injectable, Logger} from '@nestjs/common';
import {TYPES} from '../constants/types';
import {jsonLogOutput} from '../utils/json';
import PopulationData from '../data/PopulationData';
import MessageQueueHandlerInterface from '../interfaces/MessageQueueHandlerInterface';

@Injectable()
export default class PopulationHandler implements MessageQueueHandlerInterface<PopulationData> {
    private static readonly logger = new Logger('PopulationHandler');

    constructor(@Inject(TYPES.populationAggregates) private readonly aggregateHandlers: Array<MessageQueueHandlerInterface<PopulationData>>) {}

    public async handle(event: PopulationData): Promise<boolean> {
        PopulationHandler.logger.verbose(jsonLogOutput(event), {message: 'eventData'});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const promises: Array<Promise<any>> = [];

        this.aggregateHandlers.map(
            (handler: MessageQueueHandlerInterface<PopulationData>) => promises.push(handler.handle(event)
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
