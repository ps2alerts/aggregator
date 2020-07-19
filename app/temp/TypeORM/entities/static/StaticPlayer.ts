import {Entity, Column} from 'typeorm';
import {World} from '../../../../src/constants/world';
import {Faction} from '../../../../src/constants/faction';

@Entity()
export default class StaticPlayer {

    // Maps to ingame player ID
    @Column()
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
