variable "env" {
  description = "Environment name (staging | production)."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones. 2 for staging (minimal cost), raise for production."
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = "Use one NAT gateway shared across AZs (cheaper, staging default) instead of one per AZ (prod-grade HA)."
  type        = bool
  default     = true
}

variable "tags" {
  type    = map(string)
  default = {}
}
