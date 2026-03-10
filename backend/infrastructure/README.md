# AI Image Analysis - AWS Infrastructure

Terraform configuration for deploying the backend to AWS with cost-saving options.

## Architecture

- **ECS Fargate**: 0.25 vCPU, 0.5 GB RAM, x86_64
- **RDS PostgreSQL**: db.t4g.micro, no auto-scaling
- **Networking**: Public subnets for ECS (no NAT Gateways)
- **Secrets**: AWS Parameter Store (not Secrets Manager)
- **Billing**: CloudWatch alarm at $0.01

## Prerequisites

- AWS CLI configured with credentials
- Terraform >= 1.0
- [Enable billing alerts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html) in AWS Billing Preferences (required for billing alarm)

## Setup

1. Copy the example vars:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   - `db_password` - Strong password for PostgreSQL
   - `openai_api_key` - Your OpenAI API key
   - `billing_alarm_email` - Email for billing notifications

3. Initialize and apply:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. Build and push the Docker image:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
   docker build -t ai-image-analysis-backend ../backend
   docker tag ai-image-analysis-backend:latest $(terraform output -raw ecr_repository_url):latest
   docker push $(terraform output -raw ecr_repository_url):latest
   ```

5. Force a new ECS deployment to pick up the image:
   ```bash
   aws ecs update-service --cluster ai-image-analysis-cluster --service ai-image-analysis-backend --force-new-deployment
   ```

## Outputs

- `alb_dns_name` - Load balancer URL for the backend (e.g. `http://<dns>/health`)
- `ecs_cluster_name` - ECS cluster name
- `rds_endpoint` - RDS connection endpoint

## Cost Notes

- ECS Fargate 0.25 vCPU / 0.5 GB: ~$3–5/month
- RDS db.t4g.micro: ~$12–15/month
- ALB: ~$16/month
- No NAT Gateway: saves ~$32/month
- Parameter Store: Free tier (standard params)
