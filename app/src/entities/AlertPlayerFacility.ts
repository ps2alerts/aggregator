import {Entity, Column, ManyToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';

@Entity()
export class AlertPlayerFacility {

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


}
