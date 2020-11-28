import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {Client, rest} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import {ItemInterface} from '../interfaces/ItemInterface';
import Item from '../data/Item';
import Census from '../config/census';
import FakeItemFactory from '../constants/fakeItem';

@injectable()
export default class ItemBroker implements ItemBrokerInterface {
    private static readonly logger = getLogger('ItemBroker');
    private readonly wsClient: Client;
    private readonly censusConfig: Census;

    constructor(
    @inject(Client) wsClient: Client,
        @inject(Census) censusConfig: Census,
    ) {
        this.wsClient = wsClient;
        this.censusConfig = censusConfig;
    }

    public async get(itemId: number): Promise<ItemInterface> {
        if (itemId === 0 || isNaN(itemId) || !itemId) {
            ItemBroker.logger.silly('Missing item ID, serving unknown item');
            // Return a fake character with has a faction of none
            return new FakeItemFactory().build();
        }

        const get = rest.getFactory('ps2', this.censusConfig.serviceID);

        // Grab the character data from Census / Cache
        /* eslint-disable */
        try {
            await get(
                rest.limit(
                    rest.item,
                    1,
                ),
                {item_id: itemId.toString()}
            )
            .then((item) => {
                console.log('FETCHED ITEM', item);
                return new Item(item[0]);
            });
        } catch (e) {
            throw new ApplicationException(`Unable to properly grab item ${itemId} from Census. Error: ${e.message}`, 'ItemBroker');
        }
        /* eslint-enable */

        throw new ApplicationException(`Unexpected execution pathway for ItemBroker. ${itemId}`, 'ItemBroker');
    }
}
