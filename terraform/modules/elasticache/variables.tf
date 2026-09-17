variable "env" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "allowed_security_group_ids" {
  type    = list(string)
  default = []
}

variable "node_type" {
  description = "e.g. cache.t4g.micro for staging, cache.r6g.large for production."
  type        = string
}

variable "num_cache_nodes" {
  description = "1 for staging (single node), 1 for prod cluster-mode-disabled default (raise via replicas separately if HA is needed later)."
  type        = number
  default     = 1
}

variable "tags" {
  type    = map(string)
  default = {}
}
