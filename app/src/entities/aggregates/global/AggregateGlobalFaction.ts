import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from '../../Alert';
import {Faction} from '../../../constants/faction';

@Entity()
export class AggregateGlobalFaction {

    // Need to figure out how to composite key these...
    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

    @Column({
        type: 'enum',
        enum: Faction,
    })
    faction: Faction;

    // Kills players have made in alerts
    @Column()
    kills: number;

    // Players died as this faction in alerts
    @Column()
    deaths: number;

    // Teamkills as this faction in alerts
    @Column()
    teamKills: number;

    // Suicides committed in this faction in alerts
    @Column()
    suicides: number;

    // Headshots achieved in this faction in alerts
    @Column()
    headshots: number;
}
