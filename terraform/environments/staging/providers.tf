provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "coifyn"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
