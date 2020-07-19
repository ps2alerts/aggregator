import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';
import {Faction} from '../../../src/constants/faction';
import StaticOutfit from './static/StaticOutfit';
import StaticFacility from './static/StaticFacility';

@Entity()
export class AlertFacilityControl {

    @ManyToOne(
        (type) => Alert,
        (alert) => alert.id,
    )
    @JoinColumn()
    alert: Alert;

    @ManyToOne(
        (type) => StaticFacility,
        (facility) => facility.id,
    )
    @JoinColumn()
    facility: StaticFacility;

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
