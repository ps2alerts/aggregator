import Item from '../data/Item';

/* eslint-disable */
export const fakeItemData = {
    item_id: "0",
    item_category_id: "0",
    is_vehicle_weapon: "0",
    name: {
        de: "Unknown Weapon",
        en: "Unknown Weapon",
        es: "Unknown Weapon",
        fr: "Unknown Weapon",
        it: "Unknown Weapon",
        tr: "Unknown Weapon",
    },
    faction_id: "0",
    // Other crap
    item_type_id: "0",
    description: {
        de: "Unknown Weapon",
        en: "Unknown Weapon",
        es: "Unknown Weapon",
        fr: "Unknown Weapon",
        it: "Unknown Weapon",
        tr: "Unknown Weapon",
    },
    max_stack_size: "0",
    image_set_id: "0",
    image_id: "0",
    image_path: "/files/ps2/images/static/1.png",
    is_default_attachment: "0",
    activatable_ability_id: "0",
    passive_ability_id: "0",
    skill_set_id: "0"
}
/* eslint-enable */

export default class FakeItemFactory {
    public build(): Item {
        return new Item(fakeItemData);
    }
}
