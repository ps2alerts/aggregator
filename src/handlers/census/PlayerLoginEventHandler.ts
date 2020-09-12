import {injectable} from 'inversify';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import PlayerLoginEvent from './events/PlayerLoginEvent';

@injectable()
export default class PlayerLoginEventHandler implements EventHandlerInterface<PlayerLoginEvent> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/require-await
    public async handle(event: PlayerLoginEvent): Promise<boolean> {
        return true;
    }
}
