# Non-secret staging values. Copy this pattern for values the human fills in;
# DO NOT put cloudflare_api_token here — pass it via TF_VAR_cloudflare_api_token
# or an untracked *.auto.tfvars file instead.

aws_region         = "eu-north-1" # CHANGE ME — pick the region closest to your users
cloudflare_zone_id = "REPLACE_WITH_REAL_ZONE_ID"

db_instance_class = "db.t4g.micro"
redis_node_type   = "cache.t4g.micro"
