module "aggregator_production" {
  source                   = "./modules/aggregator"
  namespace                = "ps2alerts"
  environment              = "production"
  identifier               = "ps2alerts-aggregator-production"
  checksum_version         = var.checksum_version
  redis_host               = "ps2alerts-redis-master"
  redis_pass               = var.redis_pass
  redis_db                 = 0
  rabbitmq_host            = "ps2alerts-rabbitmq"
  rabbitmq_user            = "ps2alerts"
  rabbitmq_pass            = var.rabbitmq_pass
  rabbitmq_api_queue       = "api-queue-production"
  rabbitmq_api_queue_delay = "api-queue-delay-production"
  census_service_id        = var.census_service_id
  cpu_limit                = "500m"
  mem_limit                = "0.25Gi"
  cpu_request              = "300m"
  mem_request              = "0.25Gi"
  discord_webhook          = var.discord_webhook
  logger_transports        = "console"
  internal_api_host        = var.internal_api_host
  internal_api_user        = var.internal_api_user
  internal_api_pass        = var.internal_api_pass
#  dd_api_key               = var.dd_api_key
#  dd_app_key               = var.dd_app_key
}
