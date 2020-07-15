import {Entity, Column} from 'typeorm';

@Entity()
export class AlertCombatAggregate {

    @Column({
        unique: true,
    })
    alertId: number;

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
