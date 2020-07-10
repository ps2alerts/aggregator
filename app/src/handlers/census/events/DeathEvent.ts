import {injectable} from 'inversify';
import {GenericEvent} from '../../../types/censusEventTypes';

@injectable()
export default class DeathEvent {
    private readonly event: GenericEvent;

    constructor(event: GenericEvent) {
        this.event = event;
    }
}
