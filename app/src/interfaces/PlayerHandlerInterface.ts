import PlayerLoginEvent from '../handlers/census/events/PlayerLoginEvent';
import PlayerLogoutEvent from '../handlers/census/events/PlayerLogoutEvent';
import GainExperienceEvent from '../handlers/census/events/GainExperienceEvent';

export default interface PlayerHandlerInterface {
    handleLogin(loginEvent: PlayerLoginEvent): boolean;

    handleLogout(logoutEvent: PlayerLogoutEvent): boolean;

    handleExperienceEvent(gainExperienceEvent: GainExperienceEvent): void;
}
