import {injectable} from 'inversify';
import {GenericEvent} from '../../../types/censusEventTypes';

@injectable()
export default class DeathEvent {
    constructor(
        private readonly event: GenericEvent,
    ) {
    }
}
