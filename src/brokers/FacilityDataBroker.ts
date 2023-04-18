import {Inject, Injectable, Logger} from '@nestjs/common';
import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';
import FacilityData from '../data/FacilityData';
import FakeMapRegionFactory from '../constants/fakeMapRegion';
import {FacilityControl, PS2Environment, Rest} from 'ps2census';
import PS2EventQueueMessage from '../handlers/messages/PS2EventQueueMessage';
import Parser from '../utils/parser';
import Redis from 'ioredis';
import {Zone} from '../ps2alerts-constants/zone';
import {TYPES} from '../constants/types';
import {AxiosInstance} from 'axios';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {getZoneVersion} from '../utils/zoneVersion';
import {CensusFacilityRegion, CensusRegionResponseInterface} from '../interfaces/CensusRegionEndpointInterfaces';
import {getRealZoneId} from '../utils/zoneIdHandler';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';
import {ConfigService} from '@nestjs/config';
import {METRICS_NAMES} from '../modules/monitoring/MetricsConstants';

@Injectable()
export default class FacilityDataBroker {
    private static readonly logger = new Logger('FacilityDataBroker');

    private readonly censusEnvironment: PS2Environment;

    constructor(
        private readonly cacheClient: Redis,
        private readonly restClient: Rest.Client,
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly statisticsHandler: StatisticsHandler,
        config: ConfigService,
    ) {
        this.censusEnvironment = config.getOrThrow('census.environment');
    }

    public async get(event: PS2EventQueueMessage<FacilityControl>): Promise<FacilityDataInterface> {
        const environment = this.censusEnvironment;
        const facilityId = Parser.parseNumericalArgument(event.payload.facility_id);
        const zone = getRealZoneId(event.payload.zone_id);
        const cacheKey = `cache:facilityData:${environment}:${facilityId}`;

        let facilityData = new FakeMapRegionFactory().build(facilityId);

        // If FacilityID is greater than reasonable, return fake facility. This is to eliminate dynamic tutorial zones
        if (facilityId > 999999) {
            return facilityData;
        }

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            FacilityDataBroker.logger.verbose(`facilityData ${cacheKey} cache HIT`);
            this.statisticsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'facility_data', result: 'hit'});
            this.statisticsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: 'cache_hit'});

            const data = await this.cacheClient.get(cacheKey);

            this.statisticsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: 'success'});

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new FacilityData(JSON.parse(data), zone);
        }

        FacilityDataBroker.logger.verbose(`facilityData ${cacheKey} cache MISS`);
        this.statisticsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'facility_data', result: 'miss'});
        this.statisticsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: 'cache_miss'});

        const result = await this.getFacilityData(facilityId, zone);

        if (result) {
            FacilityDataBroker.logger.verbose(`Facility ID ${facilityId} successfully retrieved from PS2A API`);
            this.statisticsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: 'success'});

            facilityData = new FacilityData(result, zone);
        }

        if (!result) {
            FacilityDataBroker.logger.error(`PS2Alerts is missing the facility! ${facilityId} on zone ${zone}`);
            this.statisticsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: 'error'});

            // Log the unknown item so we can investigate
            await this.cacheClient.sadd(`unknownFacilities:${environment}`, `${facilityId}-${zone}`);
            FacilityDataBroker.logger.debug(`Unknown facility ${facilityId}-${zone} logged`);
        }

        await this.cacheClient.setex(cacheKey, 60 * 60 * 2, JSON.stringify(result)); // This cache time should also invalidate during game downtime

        return facilityData;
    }

    private async getFacilityData(facilityId: number, zone: Zone): Promise<CensusFacilityRegion | null> {
        const started = new Date();

        try {
            const result = await this.ps2AlertsApiClient.get(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                ps2AlertsApiEndpoints.censusRegions
                    .replace('{zone}', String(zone))
                    .replace('{version}', getZoneVersion(zone)),
            );
            await this.statisticsHandler.logMetric(started, MetricTypes.PS2ALERTS_API_CENSUS_REGIONS, true);

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data: CensusRegionResponseInterface = result.data;

            const facilityData: CensusFacilityRegion[] = data.map_region_list.filter((facility) => {
                return parseInt(facility.facility_id, 10) === facilityId;
            });

            // Doing filter on nothing will result in nothing so this works too
            if (facilityData.length) {
                this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {provider: 'ps2alerts_api', endpoint: 'census_regions', result: 'success'});
                return facilityData[0];
            }

            // If empty, this is a problem!
            this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {provider: 'ps2alerts_api', endpoint: 'census_regions', result: 'error'});
            return null;

        } catch (err) {
            if (err instanceof Error) {
                this.statisticsHandler.increaseCounter(METRICS_NAMES.EXTERNAL_REQUESTS, {
                    type: 'ps2alerts_api',
                    endpoint: 'census_regions',
                    result: 'error',
                });
            }

            return null;
        }
    }
}
