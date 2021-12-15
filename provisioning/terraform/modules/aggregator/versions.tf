terraform {
  required_providers {
    datadog = {
      source = "datadog/datadog"
    }
    kubernetes = {
      source = "hashicorp/kubernetes"
    }

    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
  required_version = ">= 0.13"
}
