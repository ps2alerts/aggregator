import {Rest} from "ps2census";

export type CharacterWorldOutfitLeader = Rest.Format<'character'> & {
    /* eslint-disable */
    world_id: string;
    outfit_member: Rest.Format<'outfit_member_extended'>;
    /* eslint-enable */
};
