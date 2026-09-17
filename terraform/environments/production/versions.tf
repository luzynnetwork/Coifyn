terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state — TEMPLATED, NOT ACTIVE. Uncomment once the human has
  # bootstrapped the S3 state bucket + DynamoDB lock table (see
  # terraform/README.md "Bootstrapping remote state"). Use a distinct `key`
  # per environment so staging and production never share state.
  #
  # backend "s3" {
  #   bucket         = "coifyn-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "eu-north-1"
  #   dynamodb_table = "coifyn-terraform-locks"
  #   encrypt        = true
  # }
}
