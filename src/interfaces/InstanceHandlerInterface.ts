import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';

export default interface InstanceHandlerInterface {
    handleMetagameEvent(mgeEvent: MetagameEventEvent): Promise<boolean>;
}
