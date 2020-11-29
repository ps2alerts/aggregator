import {Faction} from '../constants/faction';

export interface ItemInterface {
    id: number;
    typeId: number;
    categoryId: number;
    name: string;
    faction: Faction;
    isVehicleWeapon: boolean;
}
