import {injectable} from 'inversify';
import PlayerHandlerInterface from '../interfaces/PlayerHandlerInterface';
import PlayerLoginEvent from './census/events/PlayerLoginEvent';
import PlayerLogoutEvent from './census/events/PlayerLogoutEvent';

interface Player {
    worldId: number;
    characterId: string;
    outfitId: number;
}

@injectable()
export default class PlayerHandler implements PlayerHandlerInterface {
    private _players: Player[] = [];

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handleLogin(loginEvent: PlayerLoginEvent): Promise<boolean> {
        if (!this.containsPlayer(loginEvent.worldId, loginEvent.characterId)) {
            this._players.push({worldId: loginEvent.worldId, characterId: loginEvent.characterId, outfitId: -1});
            return true;
        }

        return false;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async handleLogout(logoutEvent: PlayerLogoutEvent): Promise<boolean> {
        this._players = this._players.filter((player) => {
            return (player.worldId !== logoutEvent.worldId || player.characterId !== logoutEvent.characterId);
        });
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
    public async updateLastSeen(worldId: number, characterId: string): Promise<boolean> {
        // TODO Update last seen for https://github.com/ps2alerts/websocket/issues/31 #31
        return true;
    }

    private containsPlayer(worldId: number, characterId: string): boolean {
        return this._players.some((player) => {
            return player.worldId === worldId && player.characterId === characterId;
        });
    }
}
