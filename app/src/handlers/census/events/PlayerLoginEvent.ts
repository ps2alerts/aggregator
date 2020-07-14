/**
 *  ### CENSUS RESPONSE ATTRIBUTES ####
 "character_id":"",
 "timestamp":"",
 "world_id":""
 * ### END ###
 **/

import {injectable} from 'inversify';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import Parser from '../../../utils/parser';
import {PlayerLogin, PS2Event} from 'ps2census';

@injectable()
export default class PlayerLoginEvent {
    public readonly characterId: number;

    public readonly worldId: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof PlayerLogin)) {
            throw new IllegalArgumentException('event', 'PlayerLoginEvent');
        }

        this.characterId = Parser.parseArgumentAsNumber(event.character_id);

        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('character_id', 'PlayerLoginEvent');
        }

        this.worldId = Parser.parseArgumentAsNumber(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'PlayerLoginEvent');
        }
    }

}
