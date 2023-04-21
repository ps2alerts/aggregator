export const METRICS_NAMES = {
    // Counts
    BROKER_COUNT: 'aggregator_broker_count',
    CACHE_COUNT: 'aggregator_cache_count',
    ERRORS_COUNT: 'aggregator_errors_count',
    EXTERNAL_REQUESTS_COUNT: 'aggregator_external_requests_count',
    INSTANCES_COUNT: 'aggregator_instances_count',
    QUEUE_MESSAGES_COUNT: 'aggregator_queue_messages_count',
    ZONE_MESSAGE_COUNT: 'aggregator_zone_message_count',

    // Gauges
    CACHE_GAUGE: 'aggregator_cache_gauge',
    INSTANCES_GAUGE: 'aggregator_instances_gauge',

    // Histograms
    EVENT_PROCESSING_HISTOGRAM: 'aggregator_event_processing_histogram',
    EXTERNAL_REQUESTS_HISTOGRAM: 'aggregator_external_requests_histogram',
};

export const PROM_METRICS = {
    // Counts
    BROKER_COUNT: 'PROM_METRIC_AGGREGATOR_BROKER_COUNT',
    CACHE_COUNT: 'PROM_METRIC_AGGREGATOR_CACHE_COUNT',
    ERRORS_COUNT: 'PROM_METRIC_AGGREGATOR_ERRORS_COUNT',
    EXTERNAL_REQUESTS_COUNT: 'PROM_METRIC_AGGREGATOR_EXTERNAL_REQUESTS_COUNT',
    INSTANCES_COUNT: 'PROM_METRIC_AGGREGATOR_INSTANCES_COUNT',
    QUEUE_MESSAGES_COUNT: 'PROM_METRIC_AGGREGATOR_QUEUE_MESSAGES_COUNT',
    ZONE_MESSAGE_COUNT: 'PROM_METRIC_AGGREGATOR_ZONE_MESSAGE_COUNT',

    // Gauges
    CACHE_GAUGE: 'PROM_METRIC_AGGREGATOR_CACHE_GAUGE',
    INSTANCES_GAUGE: 'PROM_METRIC_AGGREGATOR_INSTANCES_GAUGE',

    // Histograms
    EVENT_PROCESSING_HISTOGRAM: 'PROM_METRIC_AGGREGATOR_EVENT_PROCESSING_HISTOGRAM',
    EXTERNAL_REQUESTS_HISTOGRAM: 'PROM_METRIC_AGGREGATOR_EXTERNAL_REQUESTS_HISTOGRAM',
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
