output "cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "service_name" {
  value = aws_ecs_service.api.name
}

output "alb_dns_name" {
  value = aws_lb.api.dns_name
}

output "service_security_group_id" {
  value = aws_security_group.service.id
}
