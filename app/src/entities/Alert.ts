/* eslint-disable @typescript-eslint/explicit-member-accessibility,@typescript-eslint/no-unused-vars */
import {Entity, ObjectIdColumn, ObjectID, Column} from 'typeorm';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {AlertState} from '../constants/alertState';

@Entity()
export class Alert {

    @ObjectIdColumn()
    id: ObjectID;

    @Column({
        type: 'enum',
        enum: World,
    })
    worldId: World;

    @Column({
        type: 'enum',
        enum: Zone,
    })
    zoneId: Zone;

    @Column({
        type: 'enum',
        enum: AlertState,
    })
    state: AlertState;

    @Column()
    timestampStarted: number;

    @Column()
    timestampEnded: number;
}
