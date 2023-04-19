/* eslint-disable @typescript-eslint/naming-convention */
import {Injectable, Logger} from '@nestjs/common';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import {ItemInterface} from '../interfaces/ItemInterface';
import Item from '../data/Item';
import FakeItemFactory from '../factories/FakeItemFactory';
import {Vehicle} from '../ps2alerts-constants/vehicle';
import {Rest} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {lithafalconEndpoints} from '../ps2alerts-constants/lithafalconEndpoints';
import {CensusEnvironment} from '../types/CensusEnvironment';
import Redis from 'ioredis';
import MetricsHandler, {MetricTypes} from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';
import {METRICS_NAMES} from '../modules/metrics/MetricsConstants';
import {FalconRequestDriver} from '../drivers/FalconRequestDriver';
import {CensusRequestDriver} from '../drivers/CensusRequestDriver';

@Injectable()
export default class ItemBroker implements ItemBrokerInterface {
    private static readonly logger = new Logger('ItemBroker');

    private readonly censusEnvironment: CensusEnvironment;

    constructor(
        private readonly restClient: Rest.Client,
        private readonly cacheClient: Redis,
        private readonly censusRequestDriver: CensusRequestDriver,
        private readonly falconRequestClient: FalconRequestDriver,
        private readonly metricsHandler: MetricsHandler,
        private readonly config: ConfigService,
    ) {
        this.censusEnvironment = config.getOrThrow('census.environment');
    }

    public async get(
        itemId: number,
        vehicleId: Vehicle,
    ): Promise<ItemInterface> {
        const environment = this.censusEnvironment;

        const started = new Date();

        if (itemId === 0 || isNaN(itemId) || !itemId) {
            let item = new FakeItemFactory().build(true); // Assume it's a vehicle roadkill first

            if (!vehicleId) {
                ItemBroker.logger.verbose(`[${environment}] Missing item and vehicle ID, serving unknown item weapon / gravity`);
                item = new FakeItemFactory().build();
            }

            ItemBroker.logger.verbose(`[${environment}] Missing item ID but has vehicle ID, assuming vehicle roadkill`);
            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'item', result: 'success'});

            return item;
        }

        const cacheKey = `cache:item:${environment}:${itemId}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            ItemBroker.logger.verbose(`${cacheKey} cache HIT`);
            await this.metricsHandler.logMetric(started, MetricTypes.CACHE_ITEM_HITS, null, null);
            this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'item', result: 'hit'});
            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'item', result: 'cache_hit'});

            const data = await this.cacheClient.get(cacheKey);

            // Check if we've actually got valid JSON in the key
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return new Item(JSON.parse(data));
            } catch (err) {
                // Json didn't parse, chuck the data
                ItemBroker.logger.warn(`${cacheKey} was invalid JSON, flushing cache`);
                this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'item', result: 'invalid'});

                await this.cacheClient.del(cacheKey);
                // Fall through to the rest of the method to get the item
            }
        }

        ItemBroker.logger.verbose(`${cacheKey} MISS`);
        await this.metricsHandler.logMetric(started, MetricTypes.CACHE_ITEM_MISSES, null, null);
        this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'item', result: 'miss'});
        this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'item', result: 'cache_miss'});

        // Serve the fake item by default, if one is found it gets replaced
        let item = new FakeItemFactory().build();

        const censusItem = await this.getItemFromCensus(itemId, environment);

        // If we didn't just return a fake item or null, use it
        if (censusItem && censusItem.id !== -1) {
            ItemBroker.logger.verbose(`[${environment}] Census API found item ${itemId}!`);
            item = censusItem;
        } else {
            ItemBroker.logger.debug(`[${environment}] Census API could not find item ${itemId}!`);
        }

        if (environment === 'ps2' && !censusItem) {
            const falconItem = await this.getItemFromFalcon(itemId, environment);

            if (falconItem) {
                ItemBroker.logger.debug(`[${environment}] Falcon API found item ${itemId}!`);
                item = falconItem;
            }
        }

        if (item.id === -1) {
            // Log the unknown item so we can investigate
            await this.cacheClient.sadd(`unknownItems:${environment}`, itemId);
            ItemBroker.logger.debug(`Unknown item ${itemId} logged`);
            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'item', result: 'unknown'});

            // Returns fake
            ItemBroker.logger.warn(`[${environment}] Returning fake item in response for item ${itemId}`);
        }

        // Cache the response for 24h then return
        // Item needs to be converted back into a CensusItem interface and stored as such
        const rawCensusItem = {
            item_id: String(item.id),
            name: {
                en: item.name,
            },
            faction_id: item.faction,
            item_category_id: String(item.categoryId),
            is_vehicle_weapon: String(item.isVehicleWeapon),
        };

        this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'item', result: 'success'});

        await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(rawCensusItem));

        return item;
    }

    private async getItemFromCensus(itemId: number, environment: CensusEnvironment): Promise<ItemInterface | null> {
        const censusItem = await this.censusRequestDriver.getItem(itemId);

        if (censusItem) {
            // If we got a response from the Census API, use it
            return new Item(censusItem);
        }

        ItemBroker.logger.warn(`[${environment}] Could not find item ${itemId} in Census, or they returned garbage.`);
        return null;
    }

    private async getItemFromFalcon(itemId: number, environment: CensusEnvironment): Promise<ItemInterface> {
        const returnItem = new FakeItemFactory().build();

        if (environment !== 'ps2') {
            return returnItem;
        }

        // Grab the item data from Falcon
        try {
            const request = await this.falconRequestClient.get(lithafalconEndpoints.itemId, {params: {item_id: itemId}});

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            const data: Rest.Format<'item'> = request.data.item_list[0];

            return new Item(data);
        } catch (err) {
            if (err instanceof Error) {
                ItemBroker.logger.warn(`[${environment}] Unable to properly grab item ${itemId} from Falcon API. Error: ${err.message}`);

                throw new ApplicationException('Falcon API could not find item');
            }
        }

        return returnItem;
    }
}
