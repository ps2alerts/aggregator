import {Entity, Column} from 'typeorm';
import {Faction} from '../../constants/faction';
import {Vehicle} from "../../constants/vehicle";

@Entity()
export default class StaticVehicle {

    // Maps to ingame vehicle ID
    @Column({
        primary: true,
        type: 'enum',
        enum: Vehicle
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
