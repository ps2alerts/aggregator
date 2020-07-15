/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import {Entity, ObjectIdColumn, ObjectID, Column, OneToOne, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';
import {Faction} from '../constants/faction';
import StaticOutfit from './static/StaticOutfit';

@Entity()
export class AlertFacilityControl {

    @OneToOne(
        (type) => Alert,
        {
            primary: true,
        },
    )
    @JoinColumn
    alertId: Alert;

    @Column()
    timestamp: number;

    @Column({
        type: 'enum',
        enum: Faction,
    })
    oldFaction: Faction;

    @Column({
        type: 'enum',
        enum: Faction,
    })
    newFaction: Faction;

    @ManyToOne(
        (type) => StaticOutfit,
        (outfit) => outfit.id,
        {
            nullable: true,
        },
    )
    outfitCaptured: StaticOutfit;

    @Column()
    isDefense: boolean;

    // Potentially remove
    @Column()
    durationHeld: number;
}
