import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';

export default interface AlertHandlerInterface {
    handleMetagameEvent(mgeEvent: MetagameEventEvent): Promise<boolean>;
}
