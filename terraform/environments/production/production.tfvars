# Non-secret production values. DO NOT put cloudflare_api_token here — pass
# via TF_VAR_cloudflare_api_token or an untracked *.auto.tfvars file.

aws_region         = "eu-north-1" # CHANGE ME — must match the region chosen for staging unless data-residency requires a split
cloudflare_zone_id = "REPLACE_WITH_REAL_ZONE_ID"

db_instance_class = "db.r6g.large"
redis_node_type   = "cache.r6g.large"
az_count           = 2
desired_count      = 2
