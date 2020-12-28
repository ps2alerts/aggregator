import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';

export function calculateRemainingTime(instance: PS2AlertsInstanceInterface): number {
    const date = new Date();
    const endTime = instance.timeStarted.getTime() + instance.duration;
    return endTime - date.getTime();
}
