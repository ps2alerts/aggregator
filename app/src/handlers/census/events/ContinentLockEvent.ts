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

import { injectable } from 'inversify';
import { ContinentLock, GenericEvent } from '../../../types/censusEventTypes';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import Parser from '../../../utils/parser';
import { Zone } from '../../../constants/zone';
import FactionUtils from '../../../utils/FactionUtils';
import { Faction } from '../../../constants/faction';
import ZoneUtils from '../../../utils/ZoneUtils';

@injectable()
export default class ContinentLockEvent {
    public readonly worldId: number;
    public readonly zone: Zone;
    public readonly timestamp: number;
    public readonly triggeringFaction: Faction;
    public readonly vsPopulation: number;
    public readonly ncPopulation: number;
    public readonly trPopulation: number;

    public constructor(
        event: GenericEvent
    ) {
        const continentLockEvent = event as ContinentLock;
        this.worldId = Parser.parseArgumentAsNumber(continentLockEvent.world_id);
        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'ContinentLockEvent');
        }
        // No need to check, ZoneUtils will validate the argument
        this.zone = ZoneUtils.parse(Parser.parseArgumentAsNumber(continentLockEvent.zone_id));
        this.timestamp = Parser.parseArgumentAsNumber(continentLockEvent.timestamp);
        if (isNaN(this.timestamp)) {
            throw new IllegalArgumentException('timestamp', 'ContinentLockEvent');
        }
        this.vsPopulation = Parser.parseArgumentAsNumber(continentLockEvent.vs_population);
        if (isNaN(this.vsPopulation)) {
            throw new IllegalArgumentException('vs_population', 'ContinentLockEvent');
        }
        this.ncPopulation = Parser.parseArgumentAsNumber(continentLockEvent.nc_population);
        if (isNaN(this.ncPopulation)) {
            throw new IllegalArgumentException('nc_population', 'ContinentLockEvent');
        }
        this.vsPopulation = Parser.parseArgumentAsNumber(continentLockEvent.vs_population);
        if (isNaN(this.vsPopulation)) {
            throw new IllegalArgumentException('vs_population', 'ContinentLockEvent');
        }
        this.trPopulation = Parser.parseArgumentAsNumber(continentLockEvent.tr_population);
        if (isNaN(this.trPopulation)) {
            throw new IllegalArgumentException('tr_population', 'ContinentLockEvent');
        }
        // No need to check, FactionUtils will validate the argument
        this.triggeringFaction = FactionUtils.parse(Parser.parseArgumentAsNumber(continentLockEvent.triggering_faction));
        // No use for metagame_event_id. Data suggests it is not really interesting
        // previous_faction is always 0
    }


}
