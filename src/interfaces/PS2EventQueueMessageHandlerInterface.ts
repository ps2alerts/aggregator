import {PS2Event, Stream} from 'ps2census';
import PS2EventQueueMessage from '../handlers/messages/PS2EventQueueMessage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PS2EventQueueMessageHandlerInterface<T extends PS2Event<any>> {
    readonly eventName: Stream.PS2EventNames;

    handle(event: PS2EventQueueMessage<T>): Promise<boolean>;
}
