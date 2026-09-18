# Terraform — Coifyn infrastructure

Structure: `environments/staging/` and `environments/production/` are two
separate **root modules**, each parameterized via its own `.tfvars` file,
rather than one root module driven entirely by `-var-file`. Reasoning: state
isolation between environments should be structural (separate directories,
separate `terraform init`/state), not just a flag you might forget — a wrong
`-var-file` against a shared root module is exactly the kind of mistake that
destroys production. Both roots are thin: they just wire together the shared
building blocks in `modules/`.

```
terraform/
  modules/
    vpc/          public+private subnets, NAT, 2-AZ default
    rds/          Postgres 16, single-AZ (staging) / Multi-AZ (prod)
    elasticache/  Redis 7, single node
    ecs/          Fargate cluster + ALB + service + task def for the API
    s3/           uploads bucket, encrypted, public access blocked
    secrets/      Secrets Manager entries (JWT secrets generated; Stripe keys placeholder)
    cloudflare/   DNS (*.coifyn.app), WAF managed ruleset, rate limiting
  environments/
    staging/      root module, staging.tfvars
    production/   root module, production.tfvars
```

Nothing in this directory has been applied. No real AWS or Cloudflare
resources exist from this work. `terraform validate` was run (see below); no
`init` against a real backend, `plan`, or `apply` was run.

## What the human must supply before any of this can run for real

1. **An AWS account** (staging and production may be the same account with
   separate resource naming, or two accounts — either works with this
   layout; a second account only requires re-running the OIDC role setup in
   `.github/workflows/README.md` for that account too).
2. **A chosen AWS region** — set `aws_region` in each `.tfvars`.
3. **Cloudflare zone ownership of `coifyn.app`** and:
   - the zone id (`cloudflare_zone_id` in each `.tfvars`)
   - an API token scoped to `Zone:DNS Edit` + `Zone:Firewall Services Edit`
     for that zone (`cloudflare_api_token` — **never put this in a
     committed `.tfvars`**; export `TF_VAR_cloudflare_api_token` or use an
     untracked `*.auto.tfvars`)
4. **Bootstrapping remote state** (one-time, manual, before first real use):
   the `backend "s3"` block in each environment's `versions.tf` is commented
   out because the state bucket doesn't exist yet. Create it once, by hand
   (not with this Terraform, to avoid a chicken-and-egg problem):
   ```
   aws s3api create-bucket --bucket coifyn-terraform-state --region <region> \
     --create-bucket-configuration LocationConstraint=<region>
   aws s3api put-bucket-versioning --bucket coifyn-terraform-state \
     --versioning-configuration Status=Enabled
   aws dynamodb create-table --table-name coifyn-terraform-locks \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```
   Then uncomment the `backend "s3"` block in
   `environments/<env>/versions.tf` and run `terraform init -migrate-state`
   (or a fresh `init`, since nothing was ever applied locally).
5. **AWS OIDC deploy role ARNs** for `deploy.yml` — see
   `.github/workflows/README.md`. Not needed for `terraform apply` itself
   (that's run by a human with their own credentials), only for the
   post-provisioning `aws ecs update-service` deploys.

## Commands the human runs themselves (NOT run by this agent)

```
cd terraform/environments/staging
terraform init                     # after uncommenting the S3 backend, or local state for a first look
terraform plan  -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars

cd ../production
terraform init
terraform plan  -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

## Secrets policy

No real credentials, account IDs, zone IDs, or ARNs are committed anywhere in
this directory. `secrets.tf` in each environment creates **empty/placeholder**
Secrets Manager entries (JWT secrets get a Terraform-generated random value;
Stripe keys get a `REPLACE_ME_MANUALLY` placeholder) with
`lifecycle.ignore_changes` on the secret value, so the human can fill in real
values via the AWS console/CLI without Terraform ever seeing or reverting
them. RDS's own master password uses `manage_master_user_password = true`,
which is Secrets-Manager-owned by AWS from creation — Terraform never
generates or reads it in plaintext.

## Validation performed (by this agent)

`terraform fmt -recursive` and `terraform validate` (with
`terraform init -backend=false`, which touches no real infra) — see the task
report for pass/fail and the terraform CLI version used, or a note that the
CLI wasn't available in this environment.
