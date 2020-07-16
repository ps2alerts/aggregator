
import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from '../../Alert';
import StaticPlayer from '../../static/StaticPlayer';
import StaticClass from '../../static/StaticClass';

@Entity()
export class AggregateAlertPlayerClass {

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
    @ManyToOne(
        (type) => StaticClass,
        (loadout) => loadout.id,
    )
    @JoinColumn()
    class: StaticClass;

    // Number of other players killed in the alert as this class
    @Column()
    kills: number;

    // Player has died to other players in the alert while in this class
    @Column()
    deaths: number;

    // Player has killed other friendly players in the alert as this class
    @Column()
    teamKills: number;

    // Player has killed themselves in the alert as this class
    @Column()
    suicides: number;

    // Total alert headshots achieved as this class
    @Column()
    headshots: number;
}
