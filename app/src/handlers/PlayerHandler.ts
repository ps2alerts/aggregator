import {injectable} from 'inversify';
import PlayerHandlerInterface from '../interfaces/PlayerHandlerInterface';
import PlayerLoginEvent from './census/events/PlayerLoginEvent';
import PlayerLogoutEvent from './census/events/PlayerLogoutEvent';

interface Player {
    worldId: number;
    characterId: number;
    outfitId: number;
}

@injectable()
export default class PlayerHandler implements PlayerHandlerInterface {
    private _players: Player[] = [];

    public handleLogin(loginEvent: PlayerLoginEvent): boolean {
        if (!this.containsPlayer(loginEvent.worldId, loginEvent.characterId)) {
            this._players.push({worldId: loginEvent.worldId, characterId: loginEvent.characterId, outfitId: -1});
            return true;
        }

        return false;
    }

    public handleLogout(logoutEvent: PlayerLogoutEvent): boolean {
        this._players = this._players.filter((player) => {
            return (player.worldId !== logoutEvent.worldId || player.characterId !== logoutEvent.characterId);
        });
        return true;
    }

    private containsPlayer(worldId: number, characterId: number): boolean {
        return this._players.some((player) => {
            return player.worldId === worldId && player.characterId === characterId;
        });
    }
}
