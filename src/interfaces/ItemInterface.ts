import {Faction} from '../ps2alerts-constants/faction';

export interface ItemInterface {
    id: number;
    typeId: number;
    categoryId: number;
    name: string;
    faction: Faction;
    isVehicleWeapon: boolean;
}
