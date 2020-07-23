module "websocket_production" {
  source           = "./modules/websocket"
  namespace        = "ps2alerts"
  environment      = "production"
  identifier       = "ps2alerts-websocket-production"
  url              = "wss.ps2alerts.com"
  checksum_version = var.checksum_version
}
