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
    alert: Alert;

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

    // Kills player has made in the alert
    @Column()
    kills: number;

    // Times the player has died in the aelrt
    @Column()
    deaths: number;

    // Teamkills player has performed in the alert
    @Column()
    teamKills: number;

    // Suicides the player has commited during the alert
    @Column()
    suicides: number;

    // Headshots the player has achieved in the alert
    @Column()
    headshots: number;
}
