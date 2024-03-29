import {PS2Event} from 'ps2census';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class PS2EventQueueMessage<T extends PS2Event<any>> {
    constructor(
        public readonly payload: T,
        public readonly instance: PS2AlertsInstanceInterface,
    ) {}
}
