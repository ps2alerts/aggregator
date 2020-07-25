variable "namespace" {
  default = "ps2alerts"
}

variable "identifier" {
  default = "ps2alerts"
}

variable "environment" {
  default = "dev"
}

variable "url" {
  default = "ps2alerts.com"
}

variable "database_user" {
  default = "foo"
}

variable "database_pass" {
  default = "foo"
}

variable "database_host" {
  default = "foo"
}

variable "database_port" {
  default = 1337
}

variable "database_name" {
  default = "foo"
}

variable "database_pool_size" {
  default = 10
}

variable "database_debug" {
  default = false
}

variable "redis_enabled" {
  default = false
}

variable "redis_host" {
  default = "foo"
}

variable "redis_db" {
  default = 0
}

variable "census_service_id" {
  default = "foo"
}

variable "cpu_limit" {
  default = "250m"
}

variable "mem_limit" {
  default = "256Mi"
}

variable "cpu_request" {
  default = "250m"
}

variable "mem_request" {
  default = "256Mi"
}

# This therefore requires the CLI variable to be defined. If none is supplied it'll use this, which is wrong!
variable "checksum_version" {
  default = "UNKNOWN"
}
