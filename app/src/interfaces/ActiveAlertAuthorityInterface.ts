import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';
import ActiveAlertInterface from './ActiveAlertInterface';

export default interface ActiveAlertAuthorityInterface {
    getAlert(world: number, zone: number): ActiveAlertInterface;

    addAlert(mge: MetagameEventEvent): Promise<boolean>;

    endAlert(mge: MetagameEventEvent): Promise<boolean>;

    exists(mgs: MetagameEventEvent): boolean;
}
