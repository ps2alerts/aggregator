/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import {Entity, Column, OneToMany} from 'typeorm';
import {World} from '../../constants/world';
import {Faction} from '../../constants/faction';

@Entity()
export default class StaticOutfit {

    // Maps to ingame outfit ID
    @Column({
        primary: true,
    })
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: World,
    })
    server: World;

    @Column({
        type: 'enum',
        enum: Faction,
    })
    faction: Faction;
}
