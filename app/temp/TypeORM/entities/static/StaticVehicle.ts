import {Entity, Column} from 'typeorm';
import {Faction} from '../../../../src/constants/faction';
import {Vehicle} from '../../../../src/constants/vehicle';

@Entity()
export default class StaticVehicle {

    // Maps to ingame vehicle ID
    @Column({
        type: 'enum',
        enum: Vehicle,
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
