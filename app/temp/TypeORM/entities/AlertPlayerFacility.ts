import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';
import StaticPlayer from './static/StaticPlayer';
import {PlayerFacility} from '../../../src/constants/playerFacility';

@Entity()
export class AlertPlayerFacility {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

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

    @Column({
        type: 'enum',
        enum: PlayerFacility,
    })
    type: PlayerFacility;
}
