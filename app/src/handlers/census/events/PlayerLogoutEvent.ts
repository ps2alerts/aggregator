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
import {PlayerLogout, PS2Event} from 'ps2census';

@injectable()
export default class PlayerLogoutEvent {
    public readonly characterId: string;

    public readonly worldId: number;

    constructor(
        event: PS2Event,
    ) {
        if (!(event instanceof PlayerLogout)) {
            throw new IllegalArgumentException('event', 'PlayerLogoutEvent');
        }

        this.characterId = event.character_id; // This is a string on purpose

        this.worldId = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('world_id', 'PlayerLogoutEvent');
        }
    }
}
