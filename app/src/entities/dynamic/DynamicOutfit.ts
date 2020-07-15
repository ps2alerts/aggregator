/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import StaticOutfit from '../static/StaticOutfit';
import StaticPlayer from '../static/StaticPlayer';
import {Column, Entity, JoinColumn, OneToMany, OneToOne} from 'typeorm';
import DynamicPlayer from './DynamicPlayer';

@Entity()
export default class DynamicOutfit {

    // Maps to ingame outfit ID
    @OneToOne((type) => StaticOutfit)
    @JoinColumn()
    id: StaticOutfit;

    @Column({
        type: 'varchar',
        length: 4,
    })
    tag: string;

    @OneToOne((type) => StaticPlayer)
    @JoinColumn()
    leader: StaticPlayer;

    @OneToMany(
        (type) => DynamicPlayer,
        (playerOutfit) => playerOutfit.outfit,
        {
            nullable: true,
        },
    )
    members: DynamicPlayer[];
}
