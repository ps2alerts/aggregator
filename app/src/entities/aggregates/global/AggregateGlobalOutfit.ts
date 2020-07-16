import {Entity, Column, OneToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import StaticOutfit from '../../static/StaticOutfit';

@Entity()
export class AggregateGlobalOutfit {

    // Need to figure out how to composite key these...
    @OneToOne(
        (type) => StaticOutfit,
        (outfit) => outfit.id,
    )
    @JoinColumn()
    player: StaticOutfit;

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
