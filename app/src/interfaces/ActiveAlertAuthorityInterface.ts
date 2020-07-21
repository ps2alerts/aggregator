import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';

export default interface ActiveAlertAuthorityInterface {
    addAlert(mge: MetagameEventEvent): Promise<boolean>;

    endAlert(mge: MetagameEventEvent): Promise<boolean>;

    exists(mgs: MetagameEventEvent): boolean;
}
