import {CensusEnvironment} from '../types/CensusEnvironment';

export default interface EventHandlerInterface<I> {
    handle(event: I, environment: CensusEnvironment): Promise<boolean>;
}
