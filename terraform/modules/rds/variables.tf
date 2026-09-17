variable "env" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  description = "Private subnet ids the RDS subnet group spans."
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security groups allowed to reach Postgres on 5432 (typically the ECS service SG)."
  type        = list(string)
  default     = []
}

variable "instance_class" {
  description = "e.g. db.t4g.micro for staging, db.r6g.large for production. No default — the caller's .tfvars must set an env-appropriate size so staging never accidentally gets prod-scale hardware."
  type        = string
}

variable "allocated_storage_gb" {
  type    = number
  default = 20
}

variable "multi_az" {
  description = "true for production, false for staging."
  type        = bool
  default     = false
}

variable "backup_retention_days" {
  type    = number
  default = 7
}

variable "deletion_protection" {
  type    = bool
  default = false
}

variable "db_name" {
  type    = string
  default = "coifyn"
}

variable "master_username" {
  description = "RDS master (superuser-equivalent) username. The app itself connects as the restricted coifyn_app role created by migrations, not this one."
  type        = string
  default     = "coifyn_admin"
}

variable "tags" {
  type    = map(string)
  default = {}
}
