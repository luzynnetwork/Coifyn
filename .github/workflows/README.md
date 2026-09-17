# CI/CD — what's configured, what the human still needs to set up

## `ci.yml`

Runs on every PR and on push to `main`. **No secrets or repo configuration
required** — the backend job spins up its own `postgres:16` service container,
the frontend job just installs and builds. This workflow is safe to enable as
soon as this PR merges.

## `deploy.yml`

Triggers on push to `main`, gated on `ci.yml` succeeding first (via
`workflow_run`; see the comment at the top of that file for why). It is
**inert** — every job will fail fast at the credential/registry step — until
the human completes the setup below. That's intentional: the workflow file is
correct and complete, but nothing in it can run against real infrastructure
without these.

### Required repo/environment configuration

| What | Where | Used by |
|---|---|---|
| `AWS_STAGING_DEPLOY_ROLE_ARN` | Repo secret (or `staging` environment secret) | `deploy-staging` job, assumed via OIDC |
| `AWS_PRODUCTION_DEPLOY_ROLE_ARN` | `production` environment secret | `deploy-production` job, assumed via OIDC |
| `AWS_REGION` | Repo variable | both deploy jobs |
| `CONTAINER_REGISTRY` | Repo variable, defaults to `ghcr.io` | `build-and-push` job |
| GitHub Environment `production` with required reviewers | Repo Settings → Environments (a repo-settings feature, not something this workflow file can configure) | `deploy-production` job — this is what makes production deploys wait for manual approval |
| GitHub Environment `staging` (optional, no protection needed) | Repo Settings → Environments | `deploy-staging` job |

### AWS OIDC role setup (one-time, done by the human in the AWS account)

The workflow uses `aws-actions/configure-aws-credentials` with
`role-to-assume` — **no static AWS access keys are stored in GitHub**. Before
the deploy jobs can run, the human must, in each AWS account (staging/prod may
be the same account or separate):

1. Create an OIDC identity provider for `token.actions.githubusercontent.com`
   (one per AWS account, or reuse an existing one).
2. Create an IAM role (e.g. `coifyn-staging-github-deploy`,
   `coifyn-production-github-deploy`) with a trust policy scoped to this repo
   (`repo:luzynnetwork/coifyn:*`, or narrower to `ref:refs/heads/main`) and a
   permissions policy limited to: `ecr:GetAuthorizationToken` +
   push (if using ECR instead of ghcr.io), `ecs:UpdateService`,
   `ecs:DescribeServices`, and nothing else — least privilege.
3. Put that role's ARN in the corresponding secret above.

### Container registry

Defaults to GitHub Container Registry (`ghcr.io`), authenticated with the
built-in `GITHUB_TOKEN` — no extra secret needed for that part. Swap to ECR by
changing the `CONTAINER_REGISTRY` repo variable and the login step (commented
alternative is in `deploy.yml`).

### What ties the deploy target names together

`deploy.yml` references ECS cluster/service names
(`coifyn-staging-api`, `coifyn-production-api`) that must match what
`terraform/` actually provisions — see `terraform/modules/ecs/` and each
environment's `.tfvars`. If those names diverge, update one side to match the
other.
