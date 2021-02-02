resource datadog_monitor "aggregator_not_running" {
  name = "PS2Alerts Aggregator not running [${var.environment}]"
  type = "metric alert"
  query = "max(last_1m):avg:kubernetes.pods.running{kube_deployment:ps2alerts-aggregator-${var.environment}} <= 0"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "not running"})

  thresholds = {
    critical = 0
  }

  notify_no_data = true
  require_full_window = false
  no_data_timeframe = 10

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_mem" {
  name = "PS2Alerts Aggregator high memory [${var.environment}]"
  type = "metric alert"
  query = "max(last_5m):avg:kubernetes.memory.rss{kube_container_name:ps2alerts-aggregator-${var.environment}} > 235930000"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high memory"})

  thresholds = {
    critical = 235930000 #255MB
  }

  notify_no_data = true
  require_full_window = false
  no_data_timeframe = 10

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_cpu" {
  name = "PS2Alerts Aggregator high CPU [${var.environment}]"
  type = "metric alert"
  query = "avg(last_10m):avg:kubernetes.cpu.usage.total{kube_container_name:ps2alerts-aggregator-${var.environment}} > 450000000"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high CPU"})

  thresholds = {
    critical = 450000000 # 0.4 CPU
  }

  notify_no_data = true
  require_full_window = false
  no_data_timeframe = 10

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_errors" {
  name = "PS2Alerts Aggregator high errors [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*aggregator\\-${var.environment}* status:error\").index(\"*\").rollup(\"count\").last(\"10m\") > 50"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high errors"})

  thresholds = {
    critical = 50
  }

  notify_no_data = true
  require_full_window = false
  no_data_timeframe = 10

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_restarts" {
  name = "PS2Alerts Aggregator restarts [${var.environment}]"
  type = "query alert"
  query = "change(sum(last_5m),last_5m):avg:kubernetes.containers.restarts{kube_deployment:ps2alerts-aggregator-${var.environment}} > 0.5"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "restarts"})

  thresholds = {
    critical = 0.5
  }

  notify_no_data = true
  require_full_window = false
  no_data_timeframe = 10

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_census_reconnects" {
  name = "PS2Alerts Aggregator high Census reconnections [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* Census stream connection lost\").index(\"*\").rollup(\"count\").last(\"1h\") > 5"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high census reconnections"})

  thresholds = {
    critical = 5
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_census_stale_connection" {
  name = "PS2Alerts Aggregator high Census stale connections [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* service:CensusStaleConnectionWatcherAuthority Census\").index(\"*\").rollup(\"count\").last(\"30m\") > 10"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high census stale connections"})

  thresholds = {
    critical = 10
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_tls_errors" {
  name = "PS2Alerts Aggregator high Census TLS errors [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* TLS\").index(\"*\").rollup(\"count\").last(\"30m\") > 5"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high census TLS errors"})

  thresholds = {
    critical = 5
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_unhandled_rejections" {
  name = "PS2Alerts Aggregator high unhandled rejections [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* unhandled rejection\").index(\"*\").rollup(\"count\").last(\"30m\") > 5"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high unhandled rejections"})

  thresholds = {
    critical = 5
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_high_killed" {
  name = "PS2Alerts Aggregator high killed [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* Killed\").index(\"*\").rollup(\"count\").last(\"30m\") > 1"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high killed"})

  thresholds = {
    critical = 1
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_territory_calculator_errors" {
  name = "PS2Alerts Aggregator TerritoryCalculator errors [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* status:error TerritoryCalculator failed\").index(\"*\").rollup(\"count\").last(\"15m\") > 2"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "high TerritoryCalculator errors"})

  thresholds = {
    critical = 2
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_instance_start_errors" {
  name = "PS2Alerts Aggregator Instance Start errors [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* Failed to properly run start actions\").index(\"*\").rollup(\"count\").last(\"5m\") > 0"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "instance start errors"})

  thresholds = {
    critical = 0
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_instance_start_db_errors" {
  name = "PS2Alerts Aggregator Instance Insert into DB errors [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* Unable to insert instance into DB\").index(\"*\").rollup(\"count\").last(\"5m\") > 0"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "instance insert into DB errors"})

  thresholds = {
    critical = 0
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_instance_end_errors" {
  name = "PS2Alerts Aggregator Instance End errors [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* Unable to end instance correctly\").index(\"*\").rollup(\"count\").last(\"5m\") > 0"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "instance end errors"})

  thresholds = {
    critical = 0
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}

resource datadog_monitor "aggregator_server_instability" {
  name = "PS2Alerts Server Instability [${var.environment}]"
  type = "log alert"
  query = "logs(\"container_name:*ps2alerts-aggregator-${var.environment}* Server Instability!\").index(\"*\").rollup(\"count\").last(\"5m\") > 0"
  message = templatefile("${path.module}/../../dd-monitor-message.tmpl", {environment: var.environment, application: "Aggregator", description: "server instability"})

  thresholds = {
    critical = 0
  }

  require_full_window = false

  tags = jsondecode(templatefile("${path.module}/../../dd-tags.tmpl", {environment: var.environment, application: "aggregator"}))
}
