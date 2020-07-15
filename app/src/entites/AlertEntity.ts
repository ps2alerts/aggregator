import {Entity, ObjectIdColumn, ObjectID, Column} from 'typeorm';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';

@Entity()
export class AlertEntity {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    worldId: World;

    @Column()
    zoneId: Zone;

    @Column()
    timestampStarted: number;

    @Column()
    timestampEnded: number;

}
