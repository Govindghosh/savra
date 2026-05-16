# Savra AI Presentation Engine

Savra is a production-ready, scalable AI-first EdTech platform designed to reduce teacher workload through asynchronous PPT generation.

## 🚀 Key Features

- **Asynchronous Pipeline**: Teachers don't wait for LLM calls; they poll for progress and download when ready.
- **Semantic Caching**: Drastically reduces costs by identifying and reusing similar historical requests using vector embeddings.
- **Smart Model Routing**: Tiered model strategy (Cheap vs Premium) to optimize for both cost and quality.
- **Robust JSON Repair**: Automatic validation and targeted repair of malformed AI outputs using Zod.
- **Admin Dashboard**: Full user management (Create/List/Delete Teachers and Students) and system-wide job analytics.
- **Teacher Workspace**: Generation portal with presets, status tracking, and Student account management.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (Fastify), Prisma (PostgreSQL).
- **Queue**: BullMQ, Redis.
- **AI**: OpenAI SDK (compatible with Gemini, OpenAI, and OpenRouter).
- **Rendering**: pptxgenjs.

## 🏗 System Architecture

The detailed design document can be found in [architecture/design-doc.md](./architecture/design-doc.md).

## 📝 Assumptions

1. **Storage**: For this prototype, generated files are stored in the `backend/public/files` directory. In production, this would be replaced with S3-compatible storage.
2. **LLM Availability**: We assume at least one backup provider (e.g., OpenAI) is configured if the primary (Gemini) hits a 503.
3. **Roles**: We assume 3 distinct roles: Admin (Full access), Teacher (Generation + Student management), and Student (Read-only library).

## ⏭ What was skipped (and why)

- **Signup Flow**: Kept to seed/Admin creation to focus on the core AI infrastructure.
- **WebSockets**: Used polling for progress as it's more resilient and easier to scale horizontally without sticky sessions.
- **AI Image Generation**: Focused on structural and content reliability first; images can be added as a separate worker task.

## 🌐 Live Deployment

- **Frontend**: [https://savra-frontend.vercel.app/](https://savra-frontend.vercel.app/)
- **Backend**: [https://savra-production-b9b9.up.railway.app](https://savra-production-b9b9.up.railway.app)

## 🔑 Demo Credentials

You can use the following credentials to explore the platform:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `admin123` |
| **Teacher** | `teacher@test.com` | `teacher123` |
| **Student** | `student@test.com` | `student123` |

---

## 🛠 Local Setup

1. Configure `.env` in both `frontend` and `backend` (see `.env.example`).
2. Run `docker-compose up --build`.
3. Access the platform at `http://localhost:3000`.

