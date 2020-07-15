import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from '../Alert';
import StaticPlayer from '../static/StaticPlayer';
import StaticOutfit from '../static/StaticOutfit';

@Entity()
export class AggregateAlertPlayer {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alertId: Alert;

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticPlayer,
        (player) => player.id,
    )
    @JoinColumn()

    player: StaticPlayer;

    @ManyToOne(
        (type) => StaticOutfit,
        (outfit) => outfit.id,
        {
            nullable: true,
        },
    )
    @JoinColumn()
    outfit: StaticOutfit;

    @Column()
    kills: number;

    @Column()
    deaths: number;

    @Column()
    teamKills: number;

    @Column()
    suicides: number;

    @Column()
    headshots: number;
}
