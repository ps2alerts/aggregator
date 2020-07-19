import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from '../../Alert';
import StaticVehicle from '../../static/StaticVehicle';

@Entity()
export class AggregateAlertVehicle {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticVehicle,
        (vehicle) => vehicle.id,
        {
            nullable: true,
        },
    )
    @JoinColumn()
    vehicle: StaticVehicle;

    // Number of alert vehicle kills within this vehicle
    @Column()
    kills: number;

    // Number of alert vehicles killed by this type
    @Column()
    deaths: number;

    // Number of alert teamkills performed while driving this vehicle
    @Column()
    teamKills: number;

    // Number of alert suicides performed while driving this vehicle
    @Column()
    suicides: number;

    // TODO: This may need to be split into the following categories
    // I remember now why I never finished it...
    // * Vehicle vs Infantry kills
    // * Vehicle vs Vehicle kills
    // * Deaths to Infantry
}
