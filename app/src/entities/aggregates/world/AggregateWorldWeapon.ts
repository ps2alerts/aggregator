import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import StaticWeapon from '../../static/StaticWeapon';
import {World} from '../../../constants/world';

@Entity()
export class AggregateWorldWeapon {

    @ManyToOne(
        (type) => StaticWeapon,
        (weapon) => weapon.id,
    )
    @JoinColumn()
    weapon: StaticWeapon;

    @Column({
        type: 'enum',
        enum: World,
    })
    world: World;

    // Kills player has made with weapon
    @Column()
    kills: number;

    // Player has died to the same weapon (common pool)
    @Column()
    deaths: number;

    // Teamkills player has made with the weapon
    @Column()
    teamKills: number;

    // Player has killed themselves with the weapon (e.g. C4 gone wrong)
    @Column()
    suicides: number;

    // Headshots player has made with the weapon
    @Column()
    headshots: number;
}
