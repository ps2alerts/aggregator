import PlayerLoginEvent from '../handlers/census/events/PlayerLoginEvent';
import PlayerLogoutEvent from '../handlers/census/events/PlayerLogoutEvent';

export default interface PlayerHandlerInterface {
    handleLogin(loginEvent: PlayerLoginEvent): Promise<boolean>;

    handleLogout(logoutEvent: PlayerLogoutEvent): Promise<boolean>;

    updateLastSeen(worldId: number, characterId: number): Promise<boolean>;
}
