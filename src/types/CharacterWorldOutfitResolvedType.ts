import character from 'ps2census/dist/rest/types/character';
import outfitMemberExtended from 'ps2census/dist/rest/types/outfitMemberExtended';

export type CharacterWorldOutfitResolved = character & {
    /* eslint-disable */
    world_id: string;
    outfit_member: outfitMemberExtended;
    /* eslint-enable */
};
