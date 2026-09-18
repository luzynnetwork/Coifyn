# PostgreSQL 16. Staging: single-AZ, small instance class (set via
# var.instance_class in the environment's .tfvars). Production: Multi-AZ,
# larger instance class — sizing is entirely parameterized so staging can
# never accidentally inherit prod-scale hardware.
#
# The master password is NOT set here. random_password + Secrets Manager
# (see ../secrets/secrets.tf) generates and stores it; RDS reads it via
# manage_master_user_password so no plaintext credential ever appears in
# state or a .tfvars file.

resource "aws_db_subnet_group" "this" {
  name       = "coifyn-${var.env}-db"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "coifyn-${var.env}-db-subnet-group"
  })
}

resource "aws_security_group" "db" {
  name        = "coifyn-${var.env}-db"
  description = "Postgres access for coifyn-${var.env}"
  vpc_id      = var.vpc_id

  tags = merge(var.tags, {
    Name = "coifyn-${var.env}-db-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  for_each = toset(var.allowed_security_group_ids)

  security_group_id            = aws_security_group.db.id
  referenced_security_group_id = each.value
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  description                  = "Postgres from allowed app security group"
}

resource "aws_vpc_security_group_egress_rule" "db_all" {
  security_group_id = aws_security_group.db.id
  cidr_ipv4          = "0.0.0.0/0"
  ip_protocol        = "-1"
}

resource "aws_db_instance" "this" {
  identifier     = "coifyn-${var.env}"
  engine         = "postgres"
  engine_version = "16"

  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage_gb
  storage_type          = "gp3"
  storage_encrypted     = true
  db_name               = var.db_name
  username              = var.master_username
  manage_master_user_password = true

  multi_az               = var.multi_az
  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.db.id]

  backup_retention_period = var.backup_retention_days
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "coifyn-${var.env}-final" : null

  auto_minor_version_upgrade = true
  apply_immediately          = var.env != "production"

  tags = merge(var.tags, {
    Name = "coifyn-${var.env}-postgres"
  })
}
