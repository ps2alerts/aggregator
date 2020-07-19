import {Entity, Column} from 'typeorm';
import {Faction} from '../../../../src/constants/faction';

@Entity()
export default class StaticWeapon {

    // Maps to ingame weapon ID
    // Potentially convert into a massive enum... :cry:
    @Column()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: Faction,
    })
    faction: Faction;

    // TODO: Convert to enum containing all weapon types
    @Column()
    weaponType: number;

    @Column()
    isVehicle: boolean;
}
