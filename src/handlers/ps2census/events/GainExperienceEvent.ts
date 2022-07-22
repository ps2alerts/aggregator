import {injectable} from 'inversify';
import Parser from '../../../utils/parser';
import IllegalArgumentException from '../../../exceptions/IllegalArgumentException';
import {GainExperience} from 'ps2census';
import {Loadout} from '../../../ps2alerts-constants/loadout';
import Character from '../../../data/Character';
import InstanceEvent from './InstanceEvent';
import PS2EventQueueMessage from '../../messages/PS2EventQueueMessage';

@injectable()
export default class GainExperienceEvent extends InstanceEvent {
    public readonly experienceId: number;
    public readonly loadout: Loadout;
    public readonly amount: number;

    constructor(
        event: PS2EventQueueMessage<GainExperience>,
        public readonly character: Character,
    ) {
        super(event.payload.timestamp, event.instance);

        this.character = character;

        this.experienceId = Parser.parseNumericalArgument(event.payload.experience_id);

        if (isNaN(this.experienceId)) {
            throw new IllegalArgumentException('experience_id');
        }

        this.loadout = Parser.parseNumericalArgument(event.payload.loadout_id);

        if (isNaN(this.loadout)) {
            throw new IllegalArgumentException('loadout_id');
        }

        this.amount = Parser.parseNumericalArgument(event.payload.amount);

        if (isNaN(this.amount)) {
            throw new IllegalArgumentException('amount');
        }
        // I don't think we need the other_id for anything
    }
}
