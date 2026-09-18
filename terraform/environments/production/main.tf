# Production environment — Multi-AZ RDS, larger instance classes, deletion
# protection on. Same module shape as ../staging/main.tf; only the sizing and
# a few HA flags differ, per architecture.md §9.

locals {
  env  = "production"
  tags = { Environment = local.env }
}

module "vpc" {
  source = "../../modules/vpc"

  env                = local.env
  az_count           = var.az_count
  single_nat_gateway = false # one NAT per AZ — no single point of failure in prod
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
  allocated_storage_gb        = 100
  multi_az                    = true
  backup_retention_days       = 14
  deletion_protection         = true
  tags                        = local.tags
}

module "elasticache" {
  source = "../../modules/elasticache"

  env                        = local.env
  vpc_id                     = module.vpc.vpc_id
  subnet_ids                 = module.vpc.private_subnet_ids
  allowed_security_group_ids = [module.ecs.service_security_group_id]
  node_type                   = var.redis_node_type
  num_cache_nodes             = 1 # cluster-mode-disabled single primary; raise only at the Redis Cluster trigger (architecture.md §2.3)
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
  desired_count            = var.desired_count
  cpu                      = 512
  memory                   = 1024
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
  root_record        = "*.coifyn.app"
  proxied            = true
}
