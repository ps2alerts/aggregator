module "websocket_staging" {
  source           = "./modules/websocket"
  namespace        = "ps2alerts"
  environment      = "staging"
  identifier       = "ps2alerts-websocket-staging"
  url              = "wss.staging.ps2alerts.com"
  checksum_version = var.checksum_version
}
