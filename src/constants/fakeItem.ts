import Item from '../data/Item';

/* eslint-disable */
export const fakeItemData = {
    item_id: "-1",
    item_category_id: "0",
    is_vehicle_weapon: "0",
    name: {
        de: "Gravity / Unknown",
        en: "Gravity / Unknown",
        es: "Gravity / Unknown",
        fr: "Gravity / Unknown",
        it: "Gravity / Unknown",
        tr: "Gravity / Unknown",
    },
    faction_id: "0",
    // Other crap
    item_type_id: "0",
    description: {
        de: "Gravity / Unknown",
        en: "Gravity / Unknown",
        es: "Gravity / Unknown",
        fr: "Gravity / Unknown",
        it: "Gravity / Unknown",
        tr: "Gravity / Unknown",
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

export const fakeVehicleItemData = {
    item_id: "-2",
    item_category_id: "0",
    is_vehicle_weapon: "0",
    name: {
        de: "Vehicle Ram / Roadkill",
        en: "Vehicle Ram / Roadkill",
        es: "Vehicle Ram / Roadkill",
        fr: "Vehicle Ram / Roadkill",
        it: "Vehicle Ram / Roadkill",
        tr: "Vehicle Ram / Roadkill",
    },
    faction_id: "0",
    // Other crap
    item_type_id: "0",
    description: {
        de: "Vehicle Ram / Roadkill",
        en: "Vehicle Ram / Roadkill",
        es: "Vehicle Ram / Roadkill",
        fr: "Vehicle Ram / Roadkill",
        it: "Vehicle Ram / Roadkill",
        tr: "Vehicle Ram / Roadkill",
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
    public build(vehicle = false): Item {
        if (vehicle) {
            return new Item(fakeVehicleItemData);
        }

        return new Item(fakeItemData);
    }
}
