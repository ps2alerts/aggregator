import PlayerLoginEvent from '../handlers/census/events/PlayerLoginEvent';
import PlayerLogoutEvent from '../handlers/census/events/PlayerLogoutEvent';

export default interface PlayerHandlerInterface {
    handleLogin(loginEvent: PlayerLoginEvent): boolean;

    handleLogout(logoutEvent: PlayerLogoutEvent): boolean;
}
