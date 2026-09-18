# Secrets Manager resources. Values are placeholders/generated on create and
# then IGNORED by Terraform on subsequent applies (lifecycle.ignore_changes on
# secret_string / the version resource) — the human (or a rotation Lambda)
# sets the real values out-of-band, in the AWS console or CLI, never in .tf
# or committed .tfvars.
#
# JWT secrets are the one exception where Terraform *can* safely generate the
# initial value itself (random_password), since nothing needs to know it in
# advance. DB credentials are handled by RDS's manage_master_user_password
# instead (see ../rds/rds.tf) — that secret is created and owned by AWS, not
# here.

resource "random_password" "jwt_access" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "jwt_access" {
  name = "coifyn/${var.env}/jwt-access-secret"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "jwt_access" {
  secret_id     = aws_secretsmanager_secret.jwt_access.id
  secret_string = random_password.jwt_access.result

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "jwt_refresh" {
  name = "coifyn/${var.env}/jwt-refresh-secret"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "jwt_refresh" {
  secret_id     = aws_secretsmanager_secret.jwt_refresh.id
  secret_string = random_password.jwt_refresh.result

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# Stripe keys: no safe value Terraform can generate — placeholder only, the
# human fills the real key in via the console/CLI after apply. ignore_changes
# means a later `apply` will never stomp on what the human sets.
resource "aws_secretsmanager_secret" "stripe_secret_key" {
  name = "coifyn/${var.env}/stripe-secret-key"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "stripe_secret_key" {
  secret_id     = aws_secretsmanager_secret.stripe_secret_key.id
  secret_string = "REPLACE_ME_MANUALLY"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

resource "aws_secretsmanager_secret" "stripe_webhook_secret" {
  name = "coifyn/${var.env}/stripe-webhook-secret"
  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "stripe_webhook_secret" {
  secret_id     = aws_secretsmanager_secret.stripe_webhook_secret.id
  secret_string = "REPLACE_ME_MANUALLY"

  lifecycle {
    ignore_changes = [secret_string]
  }
}
