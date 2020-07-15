import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';

@Entity()
export class AlertPopulations {

    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id
    )
    @JoinColumn()
    alert: Alert;

    // Should be calculated every 2 minutes or so
    @Column({
        type: "timestamp"
    })
    timestamp: number;

    @Column()
    vs: number;

    @Column()
    nc: number;

    @Column()
    tr: number;

    // Annoyingly we cannot calculate if NSO is fighting on behalf of the factions, except maybe who they kill, but they
    // can swap midway :-/
    @Column()
    nso: number
}
