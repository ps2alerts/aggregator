import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';
import StaticPlayer from './static/StaticPlayer';

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
    alertId: Alert;

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

    // Convert into Entity eventually
    @Column()
    attackerLoadout: number;

    // Convert into Entity eventually
    // Note: not "attackerWeapon" as someone can C4 themselves...
    @Column()
    weapon: number;

    // Convert into Entity eventually
    @Column()
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
