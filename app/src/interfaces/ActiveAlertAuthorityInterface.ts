import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';
import ActiveAlertInterface from './ActiveAlertInterface';

export default interface ActiveAlertAuthorityInterface {
    alertExists(world: number, zone: number): boolean;

    getAlert(world: number, zone: number): ActiveAlertInterface;

    addAlert(mge: MetagameEventEvent): Promise<boolean>;

    endAlert(mge: MetagameEventEvent): Promise<boolean>;
}
