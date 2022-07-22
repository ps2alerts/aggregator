import {PS2Event, Stream} from 'ps2census';
import PS2EventQueueMessage from '../handlers/messages/PS2EventQueueMessage';

export interface PS2EventQueueMessageHandlerInterface<T extends PS2Event> {
    readonly eventName: Stream.PS2EventNames;

    handle(event: PS2EventQueueMessage<T>): Promise<boolean>;
}
