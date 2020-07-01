/* eslint-disable */
import { GenericEvent } from '../types/censusEventTypes';

export default  interface EventHandlerInterface {
    handle(event: GenericEvent): boolean;
}
