terraform {
  required_providers {
    digitalocean = {
      source = "terraform-providers/digitalocean"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }
    datadog = {
      source = "datadog/datadog"
    }
  }
  required_version = ">= 0.13"
}
