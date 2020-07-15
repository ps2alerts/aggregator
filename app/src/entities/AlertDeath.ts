import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';
import StaticPlayer from './static/StaticPlayer';
import {Loadout} from '../constants/loadout';

@Entity()
export class AlertDeath {

    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
        {
            nullable: false,
        },
    )
    @JoinColumn()
    alert: Alert;

    @Column({
        type: 'timestamp',
        nullable: false,
    })

    @ManyToOne(
        (type) => StaticPlayer,
        (player) => player.id,
        {
            nullable: false,
        },
    )
    @JoinColumn()
    attacker: StaticPlayer;

    @ManyToOne(
        (type) => StaticPlayer,
        (player) => player.id,
        {
            nullable: false,
        },
    )
    @JoinColumn()
    player: StaticPlayer;

    @Column()
    attackerFiremode: number;

    @Column({
        type: 'enum',
        enum: Loadout
    })
    attackerLoadout: number;

    // Convert into Entity eventually
    // Note: not "attackerWeapon" as someone can C4 themselves...
    @Column()
    weapon: number;

    @Column({
        type: 'enum',
        enum: Loadout
    })
    playerLoadout: number;

    // Not sure this is used...
    @Column()
    isCritical: boolean;

    @Column()
    isHeadshot: boolean;

    // Not sent in via Census, will need to calculate
    @Column()
    isSuicide: boolean;

    // Convert to entity
    @Column({
        nullable: true,
    })
    vehicle: number;
}
