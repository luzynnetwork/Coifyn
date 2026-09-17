output "jwt_access_secret_arn" {
  value = aws_secretsmanager_secret.jwt_access.arn
}

output "jwt_refresh_secret_arn" {
  value = aws_secretsmanager_secret.jwt_refresh.arn
}

output "stripe_secret_key_arn" {
  value = aws_secretsmanager_secret.stripe_secret_key.arn
}

output "stripe_webhook_secret_arn" {
  value = aws_secretsmanager_secret.stripe_webhook_secret.arn
}
