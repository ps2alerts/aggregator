import { injectable } from 'inversify';
import { GenericEvent } from '../../../types/censusEventTypes';
import {PlayerLogin} from 'ps2census/dist/client/utils/PS2Events';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';

@injectable()
export default class PlayerLoginEvent {
    public readonly characterId: number;
    public readonly worldId: number;
    
    public constructor(
        event: GenericEvent
    ) {
        const playerLogin = event as PlayerLogin;
        this.characterId = PlayerLoginEvent.parseArgumentAsNumber(playerLogin.character_id);
        if (isNaN(this.characterId)) {
            throw new IllegalArgumentException('IllegalArgument: character_id');
        }
        this.worldId = PlayerLoginEvent.parseArgumentAsNumber(playerLogin.world_id);
        if (isNaN(this.worldId)) {
            throw new IllegalArgumentException('IllegalArgument: world_id');
        }
    }

    private static parseArgumentAsNumber(argument: string): number {
        if (null === argument || undefined === argument) {
            return NaN;
        }
        return parseInt(argument);
    }

}
