import {Faction} from '../constants/faction';
import {rest} from 'ps2census';
import {ItemInterface} from '../interfaces/ItemInterface';

class Item implements ItemInterface {
    public readonly id: number;
    public readonly name: string;
    public readonly faction: Faction;
    public readonly typeId: number;
    public readonly categoryId: number;
    public readonly isVehicleWeapon: boolean;

    constructor(censusItem: rest.collectionTypes.item) {
        this.id = parseInt(censusItem.item_id, 10);
        this.name = censusItem.name.en;
        this.faction = parseInt(censusItem.faction_id, 10);
        this.categoryId = parseInt(censusItem.item_category_id, 10);
        this.isVehicleWeapon = censusItem.is_vehicle_weapon === '1';
    }
}

export default Item;
