resource "kubernetes_deployment" "ps2alerts_aggregator_deployment_pc" {
  metadata {
    name = join("", [var.identifier, "-", "pc"])
    namespace = var.namespace
    labels = {
      app = join("", [var.identifier, "-", "pc"])
      environment = var.environment
    }
  }
  lifecycle {
    ignore_changes = ["spec[0].replicas"]
  }
  spec {
    replicas = 1
    revision_history_limit = 1
    selector {
      match_labels = {
        name = join("", [var.identifier, "-", "pc"])
        environment = var.environment
      }
    }
    template {
      metadata {
        labels = {
          name = join("", [var.identifier, "-", "pc"])
          environment = var.environment
        }
      }
      spec {
        image_pull_secrets {
          name = "regcred"
        }
        container {
          name = join("", [var.identifier, "-", "pc"])
          image = join("", ["maelstromeous/applications:", var.identifier, "-", var.checksum_version])
          resources {
            limits = {
              cpu = "400m"
              memory = var.mem_limit
            }
            requests = {
              cpu = "250m"
              memory = var.mem_request
            }
          }
          env {
            name = "NODE_ENV"
            value = var.environment
          }
          env {
            name = "VERSION"
            value = var.checksum_version
          }
          env {
            name = "CENSUS_SERVICE_ID"
            value = var.census_service_id
          }
          env {
            name = "CENSUS_ENVIRONMENT"
            value = "ps2"
          }
          env {
            name = "REDIS_HOST"
            value = var.redis_host
          }
          env {
            name = "REDIS_PASS"
            value = var.redis_pass
          }
          env {
            name = "REDIS_DB"
            value = var.redis_db
          }
          env {
            name = "RABBITMQ_HOST"
            value = var.rabbitmq_host
          }
          env {
            name = "RABBITMQ_USER"
            value = var.rabbitmq_user
          }
          env {
            name = "RABBITMQ_PASS"
            value = var.rabbitmq_pass
          }
          env {
            name = "RABBITMQ_VHOST"
            value = "ps2alerts"
          }
          env {
            name = "RABBITMQ_API_QUEUE"
            value = var.rabbitmq_api_queue
          }
          env {
            name = "RABBITMQ_API_QUEUE_DELAY"
            value = var.rabbitmq_api_queue_delay
          }
          env {
            name = "LOGGER_DISCORD_WEBHOOK"
            value = var.discord_webhook
          }
          env {
            name = "LOGGER_TRANSPORTS"
            value = var.logger_transports
          }
          env {
            name = "INTERNAL_API_HOST"
            value = var.internal_api_host
          }
          env {
            name = "INTERNAL_API_USER"
            value = var.internal_api_user
          }
          env {
            name  = "INTERNAL_API_PASS"
            value = var.internal_api_pass
          }
        }
      }
    }
  }
}

resource "kubernetes_deployment" "ps2alerts_aggregator_deployment_ps4eu" {
  metadata {
    name = join("", [var.identifier, "-", "ps4eu"])
    namespace = var.namespace
    labels = {
      app = join("", [var.identifier, "-", "ps4eu"])
      environment = var.environment
    }
  }
  lifecycle {
    ignore_changes = ["spec[0].replicas"]
  }
  spec {
    replicas = 1
    revision_history_limit = 1
    selector {
      match_labels = {
        name = join("", [var.identifier, "-", "ps4eu"])
        environment = var.environment
      }
    }
    template {
      metadata {
        labels = {
          name = join("", [var.identifier, "-", "ps4eu"])
          environment = var.environment
        }
      }
      spec {
        image_pull_secrets {
          name = "regcred"
        }
        container {
          name = join("", [var.identifier, "-", "ps4eu"])
          image = join("", ["maelstromeous/applications:", var.identifier, "-", var.checksum_version])
          resources {
            limits = {
              cpu = "100m"
              memory = var.mem_limit
            }
            requests = {
              cpu = "50m"
              memory = var.mem_request
            }
          }
          env {
            name = "NODE_ENV"
            value = var.environment
          }
          env {
            name = "VERSION"
            value = var.checksum_version
          }
          env {
            name = "CENSUS_SERVICE_ID"
            value = var.census_service_id
          }
          env {
            name = "CENSUS_ENVIRONMENT"
            value = "ps2ps4eu"
          }
          env {
            name = "REDIS_HOST"
            value = var.redis_host
          }
          env {
            name = "REDIS_PASS"
            value = var.redis_pass
          }
          env {
            name = "REDIS_DB"
            value = var.redis_db
          }
          env {
            name = "RABBITMQ_HOST"
            value = var.rabbitmq_host
          }
          env {
            name = "RABBITMQ_USER"
            value = var.rabbitmq_user
          }
          env {
            name = "RABBITMQ_PASS"
            value = var.rabbitmq_pass
          }
          env {
            name = "RABBITMQ_VHOST"
            value = "ps2alerts"
          }
          env {
            name = "RABBITMQ_API_QUEUE"
            value = var.rabbitmq_api_queue
          }
          env {
            name = "RABBITMQ_API_QUEUE_DELAY"
            value = var.rabbitmq_api_queue_delay
          }
          env {
            name = "LOGGER_DISCORD_WEBHOOK"
            value = var.discord_webhook
          }
          env {
            name = "LOGGER_TRANSPORTS"
            value = var.logger_transports
          }
          env {
            name = "INTERNAL_API_HOST"
            value = var.internal_api_host
          }
          env {
            name = "INTERNAL_API_USER"
            value = var.internal_api_user
          }
          env {
            name  = "INTERNAL_API_PASS"
            value = var.internal_api_pass
          }
        }
      }
    }
  }
}

resource "kubernetes_deployment" "ps2alerts_aggregator_deployment_ps4us" {
  metadata {
    name = join("", [var.identifier, "-", "ps4us"])
    namespace = var.namespace
    labels = {
      app = join("", [var.identifier, "-", "ps4us"])
      environment = var.environment
    }
  }
  lifecycle {
    ignore_changes = ["spec[0].replicas"]
  }
  spec {
    replicas = 1
    revision_history_limit = 1
    selector {
      match_labels = {
        name = join("", [var.identifier, "-", "ps4us"])
        environment = var.environment
      }
    }
    template {
      metadata {
        labels = {
          name = join("", [var.identifier, "-", "ps4us"])
          environment = var.environment
        }
      }
      spec {
        image_pull_secrets {
          name = "regcred"
        }
        container {
          name = join("", [var.identifier, "-", "ps4us"])
          image = join("", ["maelstromeous/applications:", var.identifier, "-", var.checksum_version])
          resources {
            limits = {
              cpu = "100m"
              memory = var.mem_limit
            }
            requests = {
              cpu = "50m"
              memory = var.mem_request
            }
          }
          env {
            name = "NODE_ENV"
            value = var.environment
          }
          env {
            name = "VERSION"
            value = var.checksum_version
          }
          env {
            name = "CENSUS_SERVICE_ID"
            value = var.census_service_id
          }
          env {
            name = "CENSUS_ENVIRONMENT"
            value = "ps2ps4us"
          }
          env {
            name = "REDIS_HOST"
            value = var.redis_host
          }
          env {
            name = "REDIS_PASS"
            value = var.redis_pass
          }
          env {
            name = "REDIS_DB"
            value = var.redis_db
          }
          env {
            name = "RABBITMQ_HOST"
            value = var.rabbitmq_host
          }
          env {
            name = "RABBITMQ_USER"
            value = var.rabbitmq_user
          }
          env {
            name = "RABBITMQ_PASS"
            value = var.rabbitmq_pass
          }
          env {
            name = "RABBITMQ_VHOST"
            value = "ps2alerts"
          }
          env {
            name = "RABBITMQ_API_QUEUE"
            value = var.rabbitmq_api_queue
          }
          env {
            name = "RABBITMQ_API_QUEUE_DELAY"
            value = var.rabbitmq_api_queue_delay
          }
          env {
            name = "LOGGER_DISCORD_WEBHOOK"
            value = var.discord_webhook
          }
          env {
            name = "LOGGER_TRANSPORTS"
            value = var.logger_transports
          }
          env {
            name = "INTERNAL_API_HOST"
            value = var.internal_api_host
          }
          env {
            name = "INTERNAL_API_USER"
            value = var.internal_api_user
          }
          env {
            name  = "INTERNAL_API_PASS"
            value = var.internal_api_pass
          }
        }
      }
    }
  }
}
