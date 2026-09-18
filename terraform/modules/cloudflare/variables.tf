variable "env" {
  type = string
}

variable "cloudflare_zone_id" {
  description = "Zone id for coifyn.app in Cloudflare (Overview tab, right sidebar). No default — must be supplied."
  type        = string
}

variable "alb_dns_name" {
  description = "The ALB DNS name (or CloudFront domain) this env's wildcard subdomain should point at."
  type        = string
}

variable "root_record" {
  description = "The DNS name to create, e.g. '*.coifyn.app' for prod, 'staging.coifyn.app' / '*.staging.coifyn.app' for staging."
  type        = string
}

variable "proxied" {
  description = "Whether Cloudflare proxies (orange-cloud) this record — gives CDN caching + WAF. true in all envs by default."
  type        = bool
  default     = true
}
