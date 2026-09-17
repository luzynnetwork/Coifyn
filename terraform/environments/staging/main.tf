# Staging environment — small/single-AZ everything, minimal cost. Wires the
# reusable modules in terraform/modules/ together. Production
# (../production/main.tf) is the same shape with prod-sized variables.

locals {
  env  = "staging"
  tags = { Environment = local.env }
}

module "vpc" {
  source = "../../modules/vpc"

  env                = local.env
  az_count           = 2
  single_nat_gateway = true
  tags               = local.tags
}

module "secrets" {
  source = "../../modules/secrets"

  env  = local.env
  tags = local.tags
}

module "rds" {
  source = "../../modules/rds"

  env                        = local.env
  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.ecs.service_security_group_id]
  instance_class              = var.db_instance_class
  allocated_storage_gb        = 20
  multi_az                    = false
  backup_retention_days       = 3
  deletion_protection         = false
  tags                        = local.tags
}

module "elasticache" {
  source = "../../modules/elasticache"

  env                        = local.env
  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.ecs.service_security_group_id]
  node_type                   = var.redis_node_type
  num_cache_nodes             = 1
  tags                        = local.tags
}

module "s3" {
  source = "../../modules/s3"

  env  = local.env
  tags = local.tags
}

module "ecs" {
  source = "../../modules/ecs"

  env                      = local.env
  vpc_id                   = module.vpc.vpc_id
  public_subnet_ids        = module.vpc.public_subnet_ids
  private_subnet_ids       = module.vpc.private_subnet_ids
  container_image          = var.container_image
  desired_count            = 1
  cpu                      = 256
  memory                   = 512
  database_url_secret_arn  = module.rds.master_user_secret_arn
  jwt_access_secret_arn    = module.secrets.jwt_access_secret_arn
  jwt_refresh_secret_arn   = module.secrets.jwt_refresh_secret_arn
  tags                     = local.tags
}

module "cloudflare" {
  source = "../../modules/cloudflare"

  env                = local.env
  cloudflare_zone_id = var.cloudflare_zone_id
  alb_dns_name       = module.ecs.alb_dns_name
  root_record        = "*.staging.coifyn.app"
  proxied            = true
}
