import MetagameEventEvent from '../handlers/census/events/MetagameEventEvent';

// eslint-disable-next-line no-shadow
export function instanceId(mge: MetagameEventEvent|null, worldId: number|null = null, instanceId: number|null = null): string {
    if (mge) {
        return `${mge.world}-${mge.instanceId}`;
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `${worldId}-${instanceId}`;
}
