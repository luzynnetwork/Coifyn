# ECS Fargate cluster + service + task definition for the API. No Kubernetes
# per architecture.md — the EKS trigger is >~30 service instances, far past
# Phase 0.
#
# Naming convention deploy.yml relies on: cluster "coifyn-<env>", service
# "coifyn-<env>-api". Keep these in sync if either side changes.

resource "aws_ecs_cluster" "this" {
  name = "coifyn-${var.env}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.tags, {
    Name = "coifyn-${var.env}-cluster"
  })
}

# --- Networking: ALB in public subnets, service tasks in private subnets ----

resource "aws_security_group" "alb" {
  name        = "coifyn-${var.env}-alb"
  description = "Public ALB for coifyn-${var.env} API"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from Cloudflare / internet"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP (redirected to HTTPS at the listener)"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "coifyn-${var.env}-alb-sg" })
}

resource "aws_security_group" "service" {
  name        = "coifyn-${var.env}-api-service"
  description = "API ECS tasks for coifyn-${var.env}"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "From the ALB only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, { Name = "coifyn-${var.env}-api-service-sg" })
}

resource "aws_lb" "api" {
  name               = "coifyn-${var.env}-api"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = merge(var.tags, { Name = "coifyn-${var.env}-api-alb" })
}

resource "aws_lb_target_group" "api" {
  name        = "coifyn-${var.env}-api"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
  }

  tags = var.tags
}

# HTTPS listener needs an ACM certificate — not created here since it depends
# on DNS validation against the coifyn.app zone (see ../cloudflare). Plug the
# cert ARN in via a variable once ACM validation is done, or terminate TLS at
# Cloudflare (orange-cloud, "Full" SSL mode) and keep this listener on 80
# behind Cloudflare's proxy — the simpler Phase 0 default, used here.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.api.arn
  port               = 80
  protocol           = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# --- Task definition + service -----------------------------------------------

resource "aws_iam_role" "execution" {
  name = "coifyn-${var.env}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "execution_managed" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Execution role also needs to read the secrets referenced in the task def.
resource "aws_iam_role_policy" "execution_secrets" {
  name = "coifyn-${var.env}-ecs-execution-secrets"
  role = aws_iam_role.execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = compact([
        var.database_url_secret_arn,
        var.jwt_access_secret_arn,
        var.jwt_refresh_secret_arn,
        var.redis_url_secret_arn,
      ])
    }]
  })
}

resource "aws_iam_role" "task" {
  name = "coifyn-${var.env}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/coifyn-${var.env}-api"
  retention_in_days = var.env == "production" ? 30 : 7

  tags = var.tags
}

resource "aws_ecs_task_definition" "api" {
  family                   = "coifyn-${var.env}-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = var.container_image
      essential = true
      portMappings = [{
        containerPort = var.container_port
        protocol      = "tcp"
      }]
      environment = [
        { name = "NODE_ENV", value = var.env == "production" ? "production" : "staging" },
        { name = "PORT", value = tostring(var.container_port) },
      ]
      # Real secrets sourced from Secrets Manager at task-start time, never
      # baked into the image or plaintext env.
      secrets = compact([
        { name = "DATABASE_URL", valueFrom = var.database_url_secret_arn },
        { name = "JWT_ACCESS_SECRET", valueFrom = var.jwt_access_secret_arn },
        { name = "JWT_REFRESH_SECRET", valueFrom = var.jwt_refresh_secret_arn },
        var.redis_url_secret_arn == null ? null : { name = "REDIS_URL", valueFrom = var.redis_url_secret_arn },
      ])
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])

  tags = var.tags
}

data "aws_region" "current" {}

resource "aws_ecs_service" "api" {
  name            = "coifyn-${var.env}-api"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.service.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.http]

  tags = var.tags
}
