import {Injectable, Logger} from '@nestjs/common';
import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';
import FacilityData from '../data/FacilityData';
import FakeMapRegionFactory from '../constants/fakeMapRegion';
import {FacilityControl, PS2Environment, Rest} from 'ps2census';
import PS2EventQueueMessage from '../handlers/messages/PS2EventQueueMessage';
import Parser from '../utils/parser';
import Redis from 'ioredis';
import {Zone} from '../ps2alerts-constants/zone';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {getZoneVersion} from '../utils/zoneVersion';
import {CensusFacilityRegion, CensusRegionResponseInterface} from '../interfaces/CensusRegionEndpointInterfaces';
import {getRealZoneId} from '../utils/zoneIdHandler';
import MetricsHandler from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';
import {METRIC_VALUES, METRICS_NAMES} from '../modules/metrics/MetricsConstants';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

@Injectable()
export default class FacilityDataBroker {
    private static readonly logger = new Logger('FacilityDataBroker');

    private readonly censusEnvironment: PS2Environment;

    constructor(
        private readonly cacheClient: Redis,
        private readonly restClient: Rest.Client,
        private readonly metricsHandler: MetricsHandler,
        config: ConfigService,
        private readonly ps2AlertsApiDriver: PS2AlertsApiDriver,
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
            this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'facility_data', result: METRIC_VALUES.CACHE_HIT});
            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: METRIC_VALUES.CACHE_HIT});

            const data = await this.cacheClient.get(cacheKey);

            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: METRIC_VALUES.SUCCESS});

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new FacilityData(JSON.parse(data), zone);
        }

        FacilityDataBroker.logger.verbose(`facilityData ${cacheKey} cache MISS`);
        this.metricsHandler.increaseCounter(METRICS_NAMES.CACHE_COUNT, {type: 'facility_data', result: METRIC_VALUES.CACHE_MISS});
        this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: METRIC_VALUES.CACHE_MISS});

        const result = await this.getFacilityData(facilityId, zone);

        if (result) {
            FacilityDataBroker.logger.verbose(`Facility ID ${facilityId} successfully retrieved from PS2A API`);
            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: METRIC_VALUES.SUCCESS});

            facilityData = new FacilityData(result, zone);
        }

        if (!result) {
            FacilityDataBroker.logger.error(`PS2Alerts is missing the facility! ${facilityId} on zone ${zone}`);
            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: METRIC_VALUES.ERROR});

            // Log the unknown item so we can investigate
            await this.cacheClient.sadd(`unknownFacilities:${environment}`, `${facilityId}-${zone}`);
            FacilityDataBroker.logger.debug(`Unknown facility ${facilityId}-${zone} logged`);
        }

        await this.cacheClient.setex(cacheKey, 60 * 60 * 2, JSON.stringify(result)); // This cache time should also invalidate during game downtime

        return facilityData;
    }

    private async getFacilityData(facilityId: number, zone: Zone): Promise<CensusFacilityRegion | null> {
        try {
            const result = await this.ps2AlertsApiDriver.get(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                ps2AlertsApiEndpoints.censusRegions
                    .replace('{zone}', String(zone))
                    .replace('{version}', getZoneVersion(zone)),
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const data: CensusRegionResponseInterface = result.data;

            const facilityData: CensusFacilityRegion[] = data.map_region_list.filter((facility) => {
                return parseInt(facility.facility_id, 10) === facilityId;
            });

            // Doing filter on nothing will result in nothing so this works too
            if (facilityData.length) {
                this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: METRIC_VALUES.SUCCESS});
                return facilityData[0];
            }

            // If empty, this is a problem!
            this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {broker: 'facility_data', result: 'empty'});
            return null;

        } catch (err) {
            if (err instanceof Error) {
                this.metricsHandler.increaseCounter(METRICS_NAMES.BROKER_COUNT, {
                    broker: 'facility_data',
                    result: METRIC_VALUES.ERROR,
                });
            }

            return null;
        }
    }
}
