import {Entity, Column, OneToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import StaticClass from '../../static/StaticClass';

@Entity()
export class AggregateGlobalClass {

    // Need to figure out how to composite key these...
    @OneToOne(
        (type) => StaticClass,
        (loadout) => loadout.id,
    )
    @JoinColumn()
    class: StaticClass;

    // Number of kills as this class, globally
    @Column()
    kills: number;

    // Number of deaths as this class, globally
    @Column()
    deaths: number;

    // Number of teamkills done in this cass, globally
    @Column()
    teamKills: number;

    // Number of suicides committed in this class, globally
    @Column()
    suicides: number;

    // Number of headshots achieved in this class, globally
    @Column()
    headshots: number;
}
