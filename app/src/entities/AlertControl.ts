/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import {Entity, ObjectIdColumn, ObjectID, Column, OneToOne} from 'typeorm';
import {JoinColumn} from 'typeorm/browser';
import {Alert} from './Alert';

@Entity()
export class AlertControl {

    @OneToOne(
        (type) => Alert,
        {
            primary: true,
        },
    )
    @JoinColumn
    alertId: Alert;

    @Column()
    controlVs: number;

    @Column()
    controlNc: number;

    @Column()
    controlTr: number;

    @Column()
    controlCutoff: number;
}
