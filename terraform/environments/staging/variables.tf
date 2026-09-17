variable "aws_region" {
  description = "AWS region to deploy into. The human chooses this based on where their target users are — no default, must be set in staging.tfvars."
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token, scoped to Zone:DNS Edit + Zone:Firewall Services Edit for the coifyn.app zone. Never commit the real value — pass via TF_VAR_cloudflare_api_token env var or a .auto.tfvars file excluded by .gitignore."
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Zone id for coifyn.app (Cloudflare dashboard → Overview → API section)."
  type        = string
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "redis_node_type" {
  type    = string
  default = "cache.t4g.micro"
}

variable "container_image" {
  description = "Image ref for the API task. Placeholder until deploy.yml pushes a real tag."
  type        = string
  default     = "ghcr.io/luzynnetwork/coifyn/api:latest"
}
