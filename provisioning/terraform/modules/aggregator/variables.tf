variable "checksum_version" {}
variable "namespace" {}
variable "identifier" {}
variable "environment" {}
variable "redis_host" {}
variable "redis_db" {
  default = 0
}
variable "redis_pass" {}
variable "rabbitmq_host" {}
variable "rabbitmq_user" {}
variable "rabbitmq_pass" {}
variable "rabbitmq_api_queue" {}
variable "rabbitmq_api_queue_delay" {}
variable "census_service_id" {}
variable "cpu_limit" {
  default = "250m"
}
variable "mem_limit" {}
variable "cpu_request" {}
variable "mem_request" {}
variable "discord_webhook" {
  default = ""
}
variable "logger_transports" {
  default = "console"
}
#variable "dd_api_key" {}
#variable "dd_app_key" {}
variable "internal_api_host" {}
variable "internal_api_user" {}
variable "internal_api_pass" {}
