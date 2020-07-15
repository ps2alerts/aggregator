/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import StaticOutfit from '../static/StaticOutfit';
import StaticPlayer from '../static/StaticPlayer';
import {Column, Entity, JoinColumn, OneToOne} from 'typeorm';

@Entity()
export default class DynamicPlayer {

    // Maps to ingame player ID
    @OneToOne((type) => StaticPlayer)
    @JoinColumn()
    id: StaticPlayer;

    @OneToOne(
        (type) => StaticOutfit,
        {
            nullable: true,
        },
    )
    @JoinColumn()
    outfit: StaticOutfit;

    @Column({
        type: 'integer',
        nullable: false,
    })
    br: number;

    @Column()
    asp: boolean;

    // Tempted to make this a relationship, but might be a *lot* of records...
    @Column()
    alertsInvolved: number;

    @Column({
        type: 'datetime',
        nullable: false,
    })
    lastSeen: number;
}
