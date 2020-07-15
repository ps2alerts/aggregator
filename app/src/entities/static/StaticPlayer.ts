/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import {Entity, Column} from 'typeorm';
import {World} from '../../constants/world';
import {Faction} from '../../constants/faction';

@Entity()
export default class StaticPlayer {

    // Maps to ingame player ID
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
