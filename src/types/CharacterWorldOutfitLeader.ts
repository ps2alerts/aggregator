import {Format} from 'ps2census/dist/rest/types/collection';

export type CharacterWorldOutfitLeader = Format<'character'> & {
    /* eslint-disable */
    world_id: string;
    outfit_member: Format<'outfit_member_extended'>;
    /* eslint-enable */
};
