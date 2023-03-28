import {Inject, Injectable, Logger} from '@nestjs/common';
import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';
import FacilityData from '../data/FacilityData';
import FakeMapRegionFactory from '../constants/fakeMapRegion';
import {FacilityControl, Rest} from 'ps2census';
import config from '../config';
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

@Injectable()
export default class FacilityDataBroker {
    private static readonly logger = new Logger('FacilityDataBroker');

    constructor(
        private readonly cacheClient: Redis,
        private readonly restClient: Rest.Client,
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly timingStatisticsHandler: StatisticsHandler,
    ) {}

    public async get(event: PS2EventQueueMessage<FacilityControl>): Promise<FacilityDataInterface> {
        const environment = config.census.censusEnvironment;
        const facilityId = Parser.parseNumericalArgument(event.payload.facility_id);
        const zone = getRealZoneId(event.payload.zone_id);
        const cacheKey = `facility-${facilityId}-${environment}`;

        let facilityData = new FakeMapRegionFactory().build(facilityId);

        // If FacilityID is greater than reasonable, return fake facility. This is to eliminate dynamic tutorial zones
        if (facilityId > 999999) {
            return facilityData;
        }

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            FacilityDataBroker.logger.verbose(`facilityData ${cacheKey} cache HIT`);
            const data = await this.cacheClient.get(cacheKey);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new FacilityData(JSON.parse(data), zone);
        }

        FacilityDataBroker.logger.debug(`facilityData ${cacheKey} cache MISS`);

        const result = await this.getFacilityData(facilityId, zone);

        if (result) {
            FacilityDataBroker.logger.debug(`Facility ID ${facilityId} successfully retrieved from PS2A API`);
            facilityData = new FacilityData(result, zone);
        }

        if (!result) {
            FacilityDataBroker.logger.error(`PS2Alerts is missing the facility! ${facilityId} on zone ${zone}`);

            // Log the unknown item so we can investigate
            await this.cacheClient.sadd(config.redis.unknownFacilityKey, `${facilityId}-${zone}`);
            FacilityDataBroker.logger.debug(`Unknown facility ${facilityId}-${zone} logged`);
        }

        await this.cacheClient.setex(cacheKey, 60 * 60 * 2, JSON.stringify(result)); // This cache time should also invalidate during game downtime

        return facilityData;
    }

    private async getFacilityData(facilityId: number, zone: Zone): Promise<CensusFacilityRegion | null> {
        const started = new Date();
        const result = await this.ps2AlertsApiClient.get(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            ps2AlertsApiEndpoints.censusRegions
                .replace('{zone}', String(zone))
                .replace('{version}', getZoneVersion(zone)),
        );
        await this.timingStatisticsHandler.logTime(started, MetricTypes.CENSUS_FACILITY_DATA);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data: CensusRegionResponseInterface = result.data;

        const facilityData: CensusFacilityRegion[] = data.map_region_list.filter((facility) => {
            return parseInt(facility.facility_id, 10) === facilityId;
        });

        // Doing filter on nothing will result in nothing so this works too
        if (facilityData.length) {
            return facilityData[0];
        }

        return null;
    }
}
