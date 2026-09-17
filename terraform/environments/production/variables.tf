variable "aws_region" {
  description = "AWS region to deploy into. Should match staging unless data-residency requires otherwise."
  type        = string
}

variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type = string
}

variable "db_instance_class" {
  type    = string
  default = "db.r6g.large"
}

variable "redis_node_type" {
  type    = string
  default = "cache.r6g.large"
}

variable "az_count" {
  description = "Raise beyond 2 for production once traffic justifies more AZ spread."
  type        = number
  default     = 2
}

variable "desired_count" {
  type    = number
  default = 2
}

variable "container_image" {
  type    = string
  default = "ghcr.io/luzynnetwork/coifyn/api:latest"
}
