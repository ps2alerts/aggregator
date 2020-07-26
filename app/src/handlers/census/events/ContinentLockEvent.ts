/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "timestamp":"",
 "world_id":"",
 "zone_id":"",
 "triggering_faction":"",
 "previous_faction":"",
 "vs_population":"",
 "nc_population":"",
 "tr_population":"",
 "metagame_event_id":"",
 "event_type":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import Parser from '../../../utils/parser';
import {Zone} from '../../../constants/zone';
import FactionUtils from '../../../utils/FactionUtils';
import {Faction} from '../../../constants/faction';
import ZoneUtils from '../../../utils/ZoneUtils';
import {ContinentLock, PS2Event} from 'ps2census';
import {World} from '../../../constants/world';

@injectable()
export default class ContinentLockEvent {
    public readonly world: World;

    public readonly zone: Zone;

    public readonly timestamp: Date;

    public readonly triggeringFaction: Faction;

    public readonly vsPopulation: number;

    public readonly ncPopulation: number;

    public readonly trPopulation: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof ContinentLock)) {
            throw new IllegalArgumentException('event', 'ContinentLockEvent');
        }

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'ContinentLockEvent');
        }

        // No need to check, ZoneUtils will validate the argument
        this.zone = ZoneUtils.parse(Parser.parseNumericalArgument(event.zone_id));

        // Validation not required
        this.timestamp = event.timestamp;

        this.vsPopulation = Parser.parseNumericalArgument(event.vs_population);

        if (isNaN(this.vsPopulation)) {
            throw new IllegalArgumentException('vs_population', 'ContinentLockEvent');
        }

        this.ncPopulation = Parser.parseNumericalArgument(event.nc_population);

        if (isNaN(this.ncPopulation)) {
            throw new IllegalArgumentException('nc_population', 'ContinentLockEvent');
        }

        this.vsPopulation = Parser.parseNumericalArgument(event.vs_population);

        if (isNaN(this.vsPopulation)) {
            throw new IllegalArgumentException('vs_population', 'ContinentLockEvent');
        }

        this.trPopulation = Parser.parseNumericalArgument(event.tr_population);

        if (isNaN(this.trPopulation)) {
            throw new IllegalArgumentException('tr_population', 'ContinentLockEvent');
        }

        // No need to check, FactionUtils will validate the argument
        this.triggeringFaction = FactionUtils.parse(Parser.parseNumericalArgument(event.triggering_faction));
        // No use for metagame_event_id. Data suggests it is not really interesting
        // previous_faction is always 0
    }
}
