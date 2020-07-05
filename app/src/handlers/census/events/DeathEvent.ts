import { injectable } from 'inversify';
import { GenericEvent } from '../../../types/censusEventTypes';

@injectable()
export default class DeathEvent {
    public constructor(
        private event: GenericEvent
    ) {
    }
}
