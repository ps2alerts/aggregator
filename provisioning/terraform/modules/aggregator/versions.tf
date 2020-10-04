terraform {
  required_providers {
    datadog = {
      source = "datadog/datadog"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
  }
  required_version = ">= 0.13"
}
