import {Document, Schema} from 'mongoose';
import {World, worldArray} from '../../constants/world';
import {Zone, zoneArray} from '../../constants/zone';
import {MetagameEventType, metagameEventTypeArray} from '../../constants/metagameEventType';
import PS2AlertsInstanceInterface from '../../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState, ps2alertsEventStateArray} from '../../constants/ps2alertsEventState';
import {TerritoryResultInterface} from '../../calculators/TerritoryCalculator';
import {Bracket, ps2alertsBracketArray} from '../../constants/bracket';

export interface InstanceMetagameTerritorySchemaInterface extends Document {
    instanceId: PS2AlertsInstanceInterface['instanceId'];
    world: World;
    timeStarted: Date;
    timeEnded: Date | null;
    result: TerritoryResultInterface | null;
    zone: Zone;
    censusInstanceId: number;
    censusMetagameEventType: MetagameEventType;
    duration: number;
    state: Ps2alertsEventState;
    bracket: Bracket | null;
}

export const instanceMetagameTerritorySchema: Schema = new Schema({
    instanceId: {
        type: String,
        required: true,
    },
    world: {
        type: Number,
        enum: worldArray,
        required: true,
    },
    timeStarted: {
        type: Date,
        required: true,
    },
    timeEnded: {
        type: Date,
    },
    result: {
        type: Object,
    },
    zone: {
        type: Number,
        enum: zoneArray,
        required: true,
    },
    censusInstanceId: {
        type: Number,
        required: true,
    },
    censusMetagameEventType: {
        type: Number,
        enum: metagameEventTypeArray,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    state: {
        type: Number,
        enum: ps2alertsEventStateArray,
        required: true,
    },
    bracket: {
        type: Number,
        enum: ps2alertsBracketArray,
    },
}).index(
    {world: 1, censusInstanceId: 1},
    {unique: true},
);
