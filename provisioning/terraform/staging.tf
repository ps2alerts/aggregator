module "aggregator_staging" {
  source             = "./modules/aggregator"
  namespace          = "ps2alerts"
  environment        = "staging"
  identifier         = "ps2alerts-aggregator-staging"
  checksum_version   = var.checksum_version
  database_user      = var.db_user
  database_pass      = var.db_pass
  database_host      = "ps2alerts-db"
  database_port      = 27017
  database_name      = "ps2alerts-staging"
  database_pool_size = 20
  database_debug     = false
  redis_host         = "ps2alerts-redis-master"
  redis_pass         = var.redis_pass
  redis_db           = 1
  rabbitmq_host      = "ps2alerts-rabbitmq"
  rabbitmq_user      = "ps2alerts"
  rabbitmq_pass      = var.rabbitmq_pass
  census_service_id  = var.census_service_id
  cpu_limit          = "1000m"
  mem_limit          = "512Mi"
  cpu_request        = "500m"
  mem_request        = "512Mi"
  discord_webhook    = "https://discordapp.com/api/webhooks/736389415936720917/RkeDsvhGFjq3HSewPU_q59Et-6cHKCdkISw7apatWF8mJFc0w48YH88-_pG9hh03ljJ6"
  logger_transports  = "console,discord"
}
