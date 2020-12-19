import {ItemInterface} from './ItemInterface';
import {Vehicle} from '../constants/vehicle';

export interface ItemBrokerInterface {
    get(itemId: number, vehicleId: Vehicle): Promise<ItemInterface>;
}
