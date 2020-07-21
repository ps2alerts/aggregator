import EventHandlerInterface from '../../../interfaces/EventHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {injectable} from 'inversify';

@injectable()
export default class AlertFactionCombatAggregate implements EventHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('AlertFactionAggregate');

    public async handle(event: DeathEvent): Promise<boolean> {
        AlertFactionCombatAggregate.logger.info('Hello world!');
        return true;
    }
}
