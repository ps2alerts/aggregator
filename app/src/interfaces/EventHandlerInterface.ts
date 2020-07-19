import {PS2Event} from 'ps2census';

export default interface EventHandlerInterface {
    handle(event: PS2Event): Promise<boolean>;
}
