import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';

export function alertId(mge: MetagameEventEvent): string {
    return `${mge.worldId}-${mge.instanceId}`;
}
