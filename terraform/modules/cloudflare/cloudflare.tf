# Cloudflare CDN/WAF in front of everything, per architecture.md §2.2 — on
# before any public launch. Wildcard *.coifyn.app DNS for per-salon
# subdomains, proxied through Cloudflare (CNAME to the ALB, orange-cloud).
#
# Requires the `cloudflare` provider to be configured with an API token in
# the root module (see environments/*/providers.tf) — never hardcoded here.

resource "cloudflare_record" "wildcard" {
  zone_id = var.cloudflare_zone_id
  name    = var.root_record
  type    = "CNAME"
  content = var.alb_dns_name
  proxied = var.proxied
  ttl     = var.proxied ? 1 : 300 # ttl must be "automatic" (1) when proxied
}

# Baseline WAF: Cloudflare's managed ruleset, enabled at a conservative
# sensitivity so it doesn't need per-rule authoring for Phase 0. Bot Fight
# Mode/Super Bot Fight Mode is Enterprise-plan-gated in some Cloudflare tiers
# — left as a manual dashboard toggle if unavailable on the account's plan.
resource "cloudflare_ruleset" "waf_managed" {
  zone_id     = var.cloudflare_zone_id
  name        = "coifyn-${var.env}-waf-managed"
  description = "Cloudflare Managed Ruleset — baseline WAF"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee" # Cloudflare Managed Ruleset id
    }
    expression  = "true"
    description = "Execute Cloudflare Managed Ruleset on all requests"
    enabled     = true
  }
}

# Rate limiting on the API host to blunt brute-force / scraping — tuned
# loosely for Phase 0; revisit once real traffic patterns are known.
resource "cloudflare_ruleset" "rate_limit_api" {
  zone_id     = var.cloudflare_zone_id
  name        = "coifyn-${var.env}-rate-limit-api"
  description = "Basic rate limit for API traffic"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules {
    action      = "block"
    expression  = "(http.request.uri.path contains \"/api/v1/\")"
    description = "Rate limit API paths"
    enabled     = true

    ratelimit {
      characteristics     = ["cf.colo.id", "ip.src"]
      period              = 60
      requests_per_period = 600
      mitigation_timeout  = 60
    }
  }
}

resource "cloudflare_zone_settings_override" "this" {
  zone_id = var.cloudflare_zone_id

  settings {
    ssl                      = "full"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    automatic_https_rewrites = "on"
    browser_check             = "on"
  }
}
