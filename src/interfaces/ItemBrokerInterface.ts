import {ItemInterface} from './ItemInterface';

export interface ItemBrokerInterface {
    get(itemId: number): Promise<ItemInterface>;
}
