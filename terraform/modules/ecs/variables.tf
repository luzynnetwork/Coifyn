variable "env" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "container_image" {
  description = "Full image ref pushed by .github/workflows/deploy.yml, e.g. ghcr.io/luzynnetwork/coifyn/api:<sha>. Placeholder default so `terraform validate`/plan don't hard-fail before the first image exists."
  type        = string
  default     = "ghcr.io/luzynnetwork/coifyn/api:latest"
}

variable "container_port" {
  type    = number
  default = 4000
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "cpu" {
  description = "Fargate task CPU units (256 = .25 vCPU). Staging default small; raise per-env via tfvars."
  type        = number
  default     = 256
}

variable "memory" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 512
}

variable "database_url_secret_arn" {
  description = "Secrets Manager ARN holding the full DATABASE_URL (composed out-of-band from the RDS master secret + app role, or supplied by the human)."
  type        = string
}

variable "jwt_access_secret_arn" {
  type = string
}

variable "jwt_refresh_secret_arn" {
  type = string
}

variable "redis_url_secret_arn" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
