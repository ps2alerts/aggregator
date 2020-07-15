import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from '../Alert';
import StaticPlayer from '../static/StaticPlayer';
import StaticWeapon from '../static/StaticWeapon';

@Entity()
export class AggregateAlertPlayerWeapons {

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

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticWeapon,
        (weapon) => weapon.id,
        {
            nullable: true,
        },
    )
    @JoinColumn()
    weapon: StaticWeapon;

    // Kills player has made with weapon
    @Column()
    kills: number;

    // Player has died to the same weapon (common pool)
    @Column()
    deaths: number;

    // Teamkills player has made with the weapon
    @Column()
    teamKills: number;

    // Player has killed themself with the weapon (e.g. C4 gone wrong)
    @Column()
    suicides: number;

    // Headshots player has made with the weapon
    @Column()
    headshots: number;
}
