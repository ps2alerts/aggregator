import {Entity, Column} from 'typeorm';
import {Faction} from '../../constants/faction';
import {Loadout} from '../../constants/loadout';

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
