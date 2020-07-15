import {Entity, ObjectIdColumn, ObjectID, Column} from 'typeorm';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import {AlertState} from '../constants/alertState';

@Entity()
export class Alert {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    worldId: World;

    @Column()
    zoneId: Zone;

    @Column()
    state: AlertState;

    @Column()
    timestampStarted: number;

    @Column()
    timestampEnded: number;

}
