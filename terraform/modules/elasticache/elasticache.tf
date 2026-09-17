# Redis 7, cluster-mode disabled. Single node for staging; a small single
# primary (no read replica) by default for production too, matching
# architecture.md §2.3 — Redis Cluster is a deferred, trigger-based upgrade
# (>60% memory or >~50k ops/sec or HA requirement), not day-one infra.

resource "aws_elasticache_subnet_group" "this" {
  name       = "coifyn-${var.env}-redis"
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "redis" {
  name        = "coifyn-${var.env}-redis"
  description = "Redis access for coifyn-${var.env}"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "coifyn-${var.env}-redis-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "redis_from_app" {
  for_each = toset(var.allowed_security_group_ids)

  security_group_id            = aws_security_group.redis.id
  referenced_security_group_id = each.value
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"
  description                  = "Redis from allowed app security group"
}

resource "aws_vpc_security_group_egress_rule" "redis_all" {
  security_group_id = aws_security_group.redis.id
  cidr_ipv4          = "0.0.0.0/0"
  ip_protocol        = "-1"
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "coifyn-${var.env}"
  description           = "Coifyn ${var.env} Redis (BullMQ, sessions, rate limits, SSE fan-out)"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = var.node_type

  num_cache_clusters = var.num_cache_nodes

  subnet_group_name = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  automatic_failover_enabled = var.num_cache_nodes > 1

  tags = merge(var.tags, {
    Name = "coifyn-${var.env}-redis"
  })
}
