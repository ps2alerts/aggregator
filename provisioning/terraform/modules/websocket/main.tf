resource "kubernetes_service" "ps2alerts_websocket_service" {
  metadata {
    name = var.identifier
    namespace = var.namespace
    labels = {
      app = var.identifier
      environment = var.environment
    }
  }
  spec {
    type = "ClusterIP"
    selector = {
      app = var.identifier
      environment = var.environment
    }
    port {
      port = 443
      target_port = 443
    }
  }
}

resource "kubernetes_deployment" "ps2alerts_websocket_deployment" {
  metadata {
    name = var.identifier
    namespace = var.namespace
    labels = {
      app = var.identifier
      environment = var.environment
    }
  }
  spec {
    replicas = 1
    revision_history_limit = 1
    selector {
      match_labels = {
        app = var.identifier
        environment = var.environment
      }
    }
    template {
      metadata {
        labels = {
          app = var.identifier
          environment = var.environment
        }
      }
      spec {
        image_pull_secrets {
          name = "regcred"
        }
        container {
          name = var.identifier
          image = join("", ["maelstromeous/applications:", var.identifier, "-", var.checksum_version])
          resources {
            limits {
              cpu = var.cpu_limit
              memory = var.mem_limit
            }
            requests {
              cpu = var.cpu_request
              memory = var.mem_request
            }
          }
          port {
            container_port = 443
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
            name = "DB_USER"
            value = var.database_user
          }
          env {
            name = "DB_PASS"
            value = var.database_pass
          }
          env {
            name = "DB_HOST"
            value = var.database_host
          }
          env {
            name = "DB_PORT"
            value = var.database_port
          }
          env {
            name = "DB_NAME"
            value = var.database_name
          }
          env {
            name = "DB_DEBUG"
            value = var.database_debug
          }
          env {
            name = "DB_POOL_SIZE"
            value = var.database_pool_size
          }
          env {
            name = "CENSUS_SERVICE_ID"
            value = var.census_service_id
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
            value = "/ps2alerts"
          }
          env {
            name = "LOGGER_DISCORD_WEBHOOK"
            value = var.discord_webhook
          }
          env {
            name = "LOGGER_TRANSPORTS"
            value = var.logger_transports
          }
        }
      }
    }
  }
}

resource "kubernetes_ingress" "ps2alerts_websocket_ingress" {
  metadata {
    name = var.identifier
    namespace = var.namespace
    labels = {
      app = var.identifier
      environment = var.environment
    }
    annotations = {
      "kubernetes.io/ingress.class" = "nginx"
      "cert-manager.io/cluster-issuer" = var.identifier
      "nginx.ingress.kubernetes.io/proxy-body-size" = "10m"
    }
  }
  spec {
    backend {
      service_name = kubernetes_service.ps2alerts_websocket_service.metadata[0].name
      service_port = kubernetes_service.ps2alerts_websocket_service.spec[0].port[0].port
    }
    tls {
      hosts = [var.url]
      secret_name = var.identifier
    }
    rule {
      host = var.url
      http {
        path {
          backend {
            service_name = var.identifier
            service_port = 443
          }
        }
      }
    }
  }
}

// LetsEncrypt Certificate ClusterIssuer has to be defined via manual API call...
// see provisioning/<env>/k8s/manifests/cluster-issuer.yml
