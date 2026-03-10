# AI Image Analysis Tool - Phase 1 Archive

## Project Overview

An image analysis tool that leverages **OpenAI** and **AWS** to process and interpret images. Users can upload images and receive AI-generated analysis including object detection, text extraction (OCR), and natural language descriptions. Results are persisted for review and history tracking.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js (v20+) |
| **Backend** | Express, Sequelize, OpenAI API |
| **Frontend** | React, Vite, Tailwind CSS |
| **Database** | PostgreSQL (RDS) |
| **Infrastructure** | Docker, AWS ECS (Fargate), ECR |

## Current Status

> **Research Archive**

This project is preserved as a **Phase 1 research archive**. Image processing and analysis work correctly in local and containerized environments. The project is **currently paused** due to AWS Fargate CORS and networking challenges encountered when deploying the frontend and backend to ECS.

## Next Steps

The project is being **reset for a cleaner Phase 2 architecture**. Phase 2 will address the deployment and networking issues with a revised design, improved configuration, and clearer separation of concerns.

---

### Local Development (Reference)

```bash
# Copy environment template
cp .env.example .env
# Add OPENAI_API_KEY and DATABASE_URL to .env

# Run with Docker Compose
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend API: https://ai-image-analysis-v1.onrender.com

Note: AWS Fargate CORS issues documented for Phase 2.
