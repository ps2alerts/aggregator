import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import StaticPlayer from './static/StaticPlayer';
import {PlayerPresenceStates} from '../constants/playerPresenceStates';

@Entity()
export class PlayerPresence {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticPlayer,
        (player) => player.id,
    )
    @JoinColumn()
    player: StaticPlayer;

    // Need to figure out how to composite key these...
    @Column({
        type: 'timestamp',
    })
    timestamp: number;

    // Log if the player has logged in / out or was timed out automatically.
    @Column({
        type: 'enum',
        enum: PlayerPresenceStates,
    })
    type: PlayerPresenceStates;
}
