import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from '../../Alert';
import StaticClass from '../../static/StaticClass';

@Entity()
export class AggregateAlertClass {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => StaticClass,
        (loadout) => loadout.id,
    )
    @JoinColumn()
    class: StaticClass;

    // Total alert kills as this class
    @Column()
    kills: number;

    // Total alert deaths as this class
    @Column()
    deaths: number;

    // Total alert teamkills as this class
    @Column()
    teamKills: number;

    // Total alert suicides as this class
    @Column()
    suicides: number;

    // Total alert headshots achieved as this class
    @Column()
    headshots: number;
}
