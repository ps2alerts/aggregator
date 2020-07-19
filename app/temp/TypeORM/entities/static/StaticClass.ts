import {Entity, Column} from 'typeorm';
import {Faction} from '../../../../src/constants/faction';
import {Loadout} from '../../../../src/constants/loadout';

@Entity()
export default class StaticClass {

    // Maps to ingame loadout ID
    @Column({
        type: 'enum',
        enum: Loadout,
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
