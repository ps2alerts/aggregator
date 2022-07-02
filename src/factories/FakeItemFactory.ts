import Item from '../data/Item';
import {fakeItemData, fakeVehicleItemData} from '../constants/fakeItem';

export default class FakeItemFactory {
    public build(vehicle = false): Item {
        if (vehicle) {
            return new Item(fakeVehicleItemData);
        }

        return new Item(fakeItemData);
    }
}
