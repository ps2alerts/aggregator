import {ItemInterface} from './ItemInterface';
import {Vehicle} from '../ps2alerts-constants/vehicle';

export interface ItemBrokerInterface {
    get(
        itemId: number,
        vehicleId: Vehicle
    ): Promise<ItemInterface>;
}
