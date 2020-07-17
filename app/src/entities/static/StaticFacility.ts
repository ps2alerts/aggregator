import {Entity, Column} from 'typeorm';
import {Zone} from '../../constants/zone';
import {FacilityType} from '../../constants/facilityType';

@Entity()
export default class StaticFacility {

    // Maps to ingame facility ID
    @Column()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: FacilityType,
    })
    type: FacilityType;

    // **Potentailly** not needed as facility IDs are unique world wide
    @Column({
        type: 'enum',
        enum: Zone,
    })
    zone: Zone;
}
