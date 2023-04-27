import {getToken} from '@willsoto/nestjs-prometheus';

export const METRICS_NAMES = {
    // Counts
    BROKER_COUNT: 'aggregator_broker_count',
    CACHE_HITMISS_COUNT: 'aggregator_cache_hitmiss_count',
    ERRORS_COUNT: 'aggregator_errors_count',
    EXTERNAL_REQUESTS_COUNT: 'aggregator_external_requests_count',
    INSTANCES_COUNT: 'aggregator_instances_count',
    QUEUE_MESSAGES_COUNT: 'aggregator_queue_messages_count',
    ZONE_MESSAGE_COUNT: 'aggregator_zone_message_count',

    // Gauges
    CACHE_KEYS_GAUGE: 'aggregator_cache_keys_gauge',
    INSTANCES_GAUGE: 'aggregator_instances_gauge',

    // Histograms
    EVENT_PROCESSING_HISTOGRAM: 'aggregator_event_processing_histogram',
    EXTERNAL_REQUESTS_HISTOGRAM: 'aggregator_external_requests_histogram',
};

export const PROM_METRICS = {
    // Counts
    BROKER_COUNT: getToken(METRICS_NAMES.BROKER_COUNT),
    CACHE_HITMISS_COUNT: getToken(METRICS_NAMES.CACHE_HITMISS_COUNT),
    ERRORS_COUNT: getToken(METRICS_NAMES.ERRORS_COUNT),
    EXTERNAL_REQUESTS_COUNT: getToken(METRICS_NAMES.EXTERNAL_REQUESTS_COUNT),
    INSTANCES_COUNT: getToken(METRICS_NAMES.INSTANCES_COUNT),
    QUEUE_MESSAGES_COUNT: getToken(METRICS_NAMES.QUEUE_MESSAGES_COUNT),
    ZONE_MESSAGE_COUNT: getToken(METRICS_NAMES.ZONE_MESSAGE_COUNT),

    // Gauges
    CACHE_KEYS_GAUGE: getToken(METRICS_NAMES.CACHE_KEYS_GAUGE),
    INSTANCES_GAUGE: getToken(METRICS_NAMES.INSTANCES_GAUGE),

    // Histograms
    EVENT_PROCESSING_HISTOGRAM: getToken(METRICS_NAMES.EVENT_PROCESSING_HISTOGRAM),
    EXTERNAL_REQUESTS_HISTOGRAM: getToken(METRICS_NAMES.EXTERNAL_REQUESTS_HISTOGRAM),
};

export const METRIC_VALUES = {
    SUCCESS: 'success',
    FAILURE: 'fail',
    CACHE_HIT: 'cache_hit',
    CACHE_MISS: 'cache_miss',
    CACHE_INVALID: 'cache_invalid',
    ERROR: 'error',
    CRITICAL: 'critical',
};
