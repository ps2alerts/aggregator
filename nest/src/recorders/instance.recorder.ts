import {BaseRecorder} from './interfaces/base.recorder';

export class InstanceRecorder implements BaseRecorder {
    id = 1234;

    instanceId = 202020;
    triggerFaction = 1;
    startedAt = new Date();
    ended?: Date;
}
