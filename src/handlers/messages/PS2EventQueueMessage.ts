import {PS2Event} from 'ps2census';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';

export default class PS2EventQueueMessage<T extends PS2Event> {
    constructor(
        public readonly payload: T,
        public readonly instance: PS2AlertsInstanceInterface,
    ) {}
}
