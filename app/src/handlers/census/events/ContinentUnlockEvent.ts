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
import {ContinentUnlock, PS2Event} from 'ps2census';

@injectable()
export default class ContinentUnlockEvent {
    public readonly worldId: number;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly triggeringFaction: Faction;
    public readonly vsPopulation: number;
    public readonly ncPopulation: number;
    public readonly trPopulation: number;

    constructor(
        event: PS2Event,
    ) {
        const continentUnlockEvent = event as ContinentUnlock;
        this.worldId = Parser.parseArgumentAsNumber(continentUnlockEvent.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'ContinentUnlockEvent');
        }

        // No need to check, ZoneUtils will validate the argument
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(continentUnlockEvent.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(continentUnlockEvent.timestamp);

        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'ContinentUnlockEvent');
        }

        this.vsPopulation = Parser.parseArgumentAsNumber(continentUnlockEvent.vs_population);

        if (isNaN(this.vsPopulation)) {
            throw new IllegalArgumentException('vs_population', 'ContinentUnlockEvent');
        }

        this.ncPopulation = Parser.parseArgumentAsNumber(continentUnlockEvent.nc_population);

        if (isNaN(this.ncPopulation)) {
            throw new IllegalArgumentException('nc_population', 'ContinentUnlockEvent');
        }

        this.vsPopulation = Parser.parseArgumentAsNumber(continentUnlockEvent.vs_population);

        if (isNaN(this.vsPopulation)) {
            throw new IllegalArgumentException('vs_population', 'ContinentUnlockEvent');
        }

        this.trPopulation = Parser.parseArgumentAsNumber(continentUnlockEvent.tr_population);

        if (isNaN(this.trPopulation)) {
            throw new IllegalArgumentException('tr_population', 'ContinentUnlockEvent');
        }

        // No need to check, FactionUtils will validate the argument
        this.triggeringFaction = FactionUtils.parse(Parser.parseArgumentAsNumber(continentUnlockEvent.triggering_faction));
        // No use for metagame_event_id. Data suggests it is not really interesting
        // previous_faction is always 0
    }

}
