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
import {PlayerLogout} from 'ps2census';
import {World} from '../../../constants/world';

@injectable()
export default class PlayerLogoutEvent {
    public readonly characterId: string;

    public readonly world: World;

    constructor(event: PlayerLogout) {
        this.characterId = event.character_id; // This is a string on purpose

        this.world = Parser.parseNumericalArgument(event.world_id);

        if (isNaN(this.world)) {
            throw new IllegalArgumentException('world_id', 'PlayerLogoutEvent');
        }
    }
}