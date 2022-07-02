import {CensusEnvironment} from '../types/CensusEnvironment';
import {ItemInterface} from './ItemInterface';
import {Vehicle} from '../ps2alerts-constants/vehicle';

export interface ItemBrokerInterface {
    get(
        environment: CensusEnvironment,
        itemId: number,
        vehicleId: Vehicle
    ): Promise<ItemInterface>;
}
