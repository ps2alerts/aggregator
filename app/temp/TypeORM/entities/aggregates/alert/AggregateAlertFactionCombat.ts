import {Entity, Column, OneToOne} from 'typeorm';
import {Alert} from '../../Alert';
import {JoinColumn} from 'typeorm/browser';

@Entity()
export class AggregateAlertFactionCombat {

    @OneToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

    @Column('simple-json')
    kills: {
        vs: number;
        nc: number;
        tr: number;
        nso: number;
    };

    @Column('simple-json')
    deaths: {
        vs: number;
        nc: number;
        tr: number;
        nso: number;
    };

    @Column('simple-json')
    teamKills: {
        vs: number;
        nc: number;
        tr: number;
        nso: number;
    };

    @Column('simple-json')
    suicides: {
        vs: number;
        nc: number;
        tr: number;
        nso: number;
    };

    @Column('simple-json')
    headshots: {
        vs: number;
        nc: number;
        tr: number;
        nso: number;
    };

    @Column('simple-json')
    totals: {
        kills: number;
        deaths: number;
        teamKills: number;
        suicides: number;
        headshots: number;
    };
}
