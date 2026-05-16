# Engineering Decisions And Tradeoffs

This file explains the choices behind the Savra assignment implementation. The goal is to show production judgement without overbuilding features that are outside the core AI infrastructure problem.

## Core Problem

Savra is not mainly a PPT UI problem. The hard part is synchronous AI orchestration under scale. A teacher should not wait on one long API request while the system calls LLMs, validates JSON, renders a PPT, and handles provider failures.

The chosen architecture is:

Teacher request -> Fastify API -> validation -> auth -> dedupe -> semantic cache -> BullMQ queue -> worker -> structured AI generation -> JSON validation and repair -> template renderer -> file delivery -> polling status.

## Why Fastify

Fastify was chosen because it is small, fast, and works well for API services that need clear plugin boundaries. It also keeps request handling lightweight while workers do the heavy generation work.

Express would also work, but Fastify gives better performance headroom for frequent polling and concurrent teacher requests.

## Why Lightweight JWT And RBAC

The assignment benefits from role awareness, but not from a full auth product. The implementation keeps only the high-value parts:

- JWT login
- teacher, student, and admin roles
- route-level authorization
- seed users from environment variables

The project intentionally skips signup, email verification, OAuth, refresh token rotation, and account management screens. Those would add surface area without improving the main async AI system.

## Admin User Management

To meet the requirement for school leadership to monitor and manage the platform, we implemented a dedicated Admin Dashboard that allows:

- **User Lifecycle**: Admins can create Teachers and Students with specific roles and secure passwords.
- **System Monitoring**: A high-level view of generation jobs, failure rates, and cache hits.
- **Data Integrity**: Admins can delete users while protecting their own accounts from accidental deletion.

This moves the platform from a hardcoded seed-based system to a dynamic multi-tenant ready system where school leadership has full control over their educators and learners.


LLM calls and PPT rendering can take much longer than a normal HTTP request should. BullMQ moves heavy work out of the API process and gives the system:

- immediate job IDs for teachers
- retry support
- worker concurrency controls
- better crash recovery
- independent scaling of API and worker containers

Redis is used as the queue backend because BullMQ is mature, simple to run in Docker, and enough for this assignment scale.

## Why PostgreSQL And Prisma

PostgreSQL stores durable state: users, generation jobs, progress, cached PPT metadata, and errors. Prisma keeps schema changes explicit and makes the code easier to review.

The schema is intentionally small. It models the real production needs without adding unused analytics or organization management tables.

## Why Semantic Cache

Schools repeat topics often. "Photosynthesis for grade 8" and similar requests should not always pay full LLM cost. The cache checks exact hashes first, then semantic similarity with grade and subject guards.

This improves:

- cost per PPT
- response time
- provider dependency
- reliability during LLM outages

The current implementation supports a deterministic local embedding option for demos and an OpenAI embedding option for production-like runs.

## Why Structured AI Generation

The system does not ask the LLM to generate a complete presentation in one response. It first generates an outline, then generates slide JSON per section.

This makes failures smaller and easier to recover from. If one slide fails validation, only that slide needs repair or retry.

## Why Zod Validation And Repair

LLMs can return invalid JSON, missing fields, or extra fields. Every AI output is validated before rendering. If validation fails, the repair prompt receives the specific schema errors and tries to fix only the broken output.

This is cheaper and safer than blindly regenerating the full presentation.

## Why Template-First PPT Rendering

AI-generated visual layouts are slower, more expensive, and inconsistent. Savra needs dependable educational slides. The renderer keeps layout, typography, and slide types in code while the LLM only supplies structured content.

This keeps output predictable and easier to improve.

## Why Polling Instead Of WebSockets

Polling every few seconds is enough for job progress and easier to deploy behind normal load balancers. WebSockets are useful later, but they add sticky connection and horizontal scaling complexity that is not needed for the assignment MVP.

## Why Docker-First Local Development

PostgreSQL, Redis, backend, worker, and frontend all run through Docker Compose. This reduces environment drift and makes the project easier to review on another machine.

For deployment, the development startup commands should be replaced with production commands:

- backend: run migrations, then `npm run start --workspace backend`
- worker: run the compiled worker process
- frontend: `npm run start --workspace frontend`
- database and Redis: managed services or persistent Docker volumes

## Scope Intentionally Skipped

The following were skipped because they do not improve the assignment's main signal:

- full auth platform
- signup and password reset
- WebSocket infrastructure
- Kubernetes manifests

- microservice split
- AI image generation
- external vector database

These are reasonable future additions after the core async generation pipeline is stable.

## Deployment Notes

Before production deployment, replace all development secrets in `.env`, keep `COOKIE_SECURE=true` behind HTTPS, use persistent storage for generated PPT files, and run Prisma migrations through a controlled release step.

The current Docker setup is suitable for review and local demo. For production, remove container startup `npm install` and `prisma db push`, build immutable images, and use `prisma migrate deploy`.
