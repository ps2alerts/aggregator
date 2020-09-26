import {rest} from 'ps2census';

export type CharacterWorldOutfitLeader = rest.collectionTypes.character & {
    /* eslint-disable */
    world_id: string;
    outfit_member: rest.collectionTypes.outfitMemberExtended;
    /* eslint-enable */
};
