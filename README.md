[![Deploy](https://github.com/PawanKonwar/ai-image-analysis-v1/actions/workflows/deploy.yml/badge.svg)](https://github.com/PawanKonwar/ai-image-analysis-v1/actions/workflows/deploy.yml)

# AI Image Analysis

An image analysis tool that leverages **OpenAI Vision** and **AWS** to process and interpret images. Users can upload images and receive AI-generated analysis including object detection, text extraction (OCR), dominant colors, and natural language descriptions. Results are persisted for review and history tracking.

---

## Architecture

| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js on Vercel |
| **API** | API Gateway (REST) |
| **Backend** | Node.js + Express on ECS Fargate |
| **Storage** | Amazon S3 (image uploads) |
| **Database** | Amazon RDS (PostgreSQL) |
| **CI/CD** | GitHub Actions → ECR → ECS |

- **Vercel** hosts the frontend and serves it over HTTPS.
- **API Gateway** exposes the backend API with a public invoke URL.
- **ECS Fargate** runs the backend container (no server management).
- **S3** stores uploaded images with public-read ACL for OpenAI analysis.
- **RDS** persists analysis metadata (descriptions, objects, categories) via Sequelize.

---

## Key Solves

- **S3 DeleteObject IAM Policy** — Implemented the `s3:DeleteObject` IAM permission on the ECS Task Role so that when users delete a history item, the backend can remove the corresponding object from S3. Without this policy, delete operations would fail with access denied.
- **RDS Timestamp "Invalid Date"** — Resolved by setting `timestamps: false` on the Image model and sorting history by `id` instead of `created_at`. The frontend now handles missing date fields gracefully with a fallback display.

---

## Security: Secretless Architecture

This application uses a **secretless** design. No API keys, database passwords, or AWS credentials are stored in code or baked into images.

- **Production**: All secrets (OpenAI API key, `DATABASE_URL`, `CORS_ORIGIN`, etc.) are stored in **AWS Systems Manager Parameter Store** and loaded at runtime via the ECS Task Role.
- **IAM Task Role**: The Fargate task uses an IAM role for S3 (PutObject, DeleteObject) and Parameter Store (GetParameter) — no access keys in the container.
- **Local development**: Uses `.env` and `.env.local` (gitignored); never committed.

---

## Tech Stack

| Component | Stack |
|-----------|-------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js 20, Express, Sequelize |
| AI | OpenAI GPT-4 Vision |
| AWS | S3, RDS, ECS Fargate, Parameter Store, ECR |

---

## Local Development

```bash
# Copy environment template
cp .env.example .env
# Add OPENAI_API_KEY and DATABASE_URL to .env

# Run with Docker Compose
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

---

## Project Structure

```
├── frontend/          # React + Vite app (deployed to Vercel)
├── backend/           # Express API (Docker → ECR → ECS)
├── infrastructure/    # Terraform (VPC, RDS, ECS, S3)
└── .github/workflows/ # CI/CD (deploy.yml)
```
