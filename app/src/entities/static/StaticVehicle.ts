/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import {Entity, Column} from 'typeorm';
import {Faction} from '../../constants/faction';

@Entity()
export default class StaticVehicle {

    // Maps to ingame vehicle ID
    // TODO: Convert into a enum
    @Column({
        primary: true,
    })
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: Faction,
    })
    faction: Faction;
}
