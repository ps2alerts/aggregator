import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import StaticPlayer from '../../static/StaticPlayer';
import StaticVehicle from '../../static/StaticVehicle';

@Entity()
export class AggregateGlobalPlayerVehicle {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticPlayer,
        (player) => player.id,
    )
    @JoinColumn()
    player: StaticPlayer;

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticVehicle,
        (vehicle) => vehicle.id,
    )
    @JoinColumn()
    vehicle: StaticVehicle;

    // Number of other players player has killed in this vehicle
    @Column()
    kills: number;

    // Player has died to other vehicles
    @Column()
    deaths: number;

    // Player has killed other vehicles of the same type on the same faction
    @Column()
    teamKills: number;

    // Player has killed themselves with the vehicle
    @Column()
    suicides: number;
}
