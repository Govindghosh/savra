# Savra Technical Architecture

## High-Level Overview
Savra is built as a highly resilient, cost-optimized, asynchronous AI presentation engine. The system decouples request handling from heavy AI generation to ensure a smooth user experience.

## System Workflow (Sequence Diagram)

```mermaid
sequenceDiagram
    participant Teacher
    participant API as Fastify API
    participant DB as Postgres (Prisma)
    participant Redis as Redis (BullMQ)
    participant Worker as Background Worker
    participant LLM as LLM Providers (Tiered)

    Teacher->>API: POST /generate (Topic, Grade, Slides)
    API->>API: Check Semantic Cache
    alt Cache Hit
        API->>Teacher: Return Existing PPT URL
    else Cache Miss
        API->>DB: Create Job (queued)
        API->>Redis: Add Job to Queue
        API->>Teacher: Return Job ID
    end

    Redis->>Worker: Pick up Job
    Worker->>Worker: Update Progress (10%)
    
    Worker->>LLM: Generate Outline (Cheap Tier)
    LLM-->>Worker: Outline JSON
    
    loop Per Slide
        Worker->>LLM: Generate Content (Smart Routed Tier)
        alt Success
            LLM-->>Worker: Content JSON
        else Malformed JSON
            Worker->>LLM: Repair Prompt (Zod Errors)
            LLM-->>Worker: Fixed JSON
        end
        Worker->>Worker: Update Progress (Incremental)
    end
    
    Worker->>Worker: Render PPT (pptxgenjs)
    Worker->>DB: Mark Job Completed (PPT URL)
    
    Teacher->>API: Poll /jobs/:id
    API-->>Teacher: Job Status & Progress
    Teacher->>Teacher: Download PPT
```

## Core Components

### 1. The Orchestration Layer (Fastify + BullMQ)
*   **Decoupled Processing**: High-latency LLM calls are moved to a worker pool to prevent API timeouts.
*   **Real-time Feedback**: Incremental progress reporting (10% -> 25% -> ... -> 100%) gives teachers visual feedback.

### 2. The AI Generation Pipeline
*   **Two-Step Approach**: Outline generation precedes content generation to ensure structural integrity.
*   **Validation & Repair**: Every AI response is validated via Zod. If it fails, a targeted repair prompt is sent instead of a blind retry.

### 3. Tiered Model Strategy
*   **Cheap Tier**: Handles high-volume, low-complexity tasks such as outlines, summaries, quizzes, activities, and JSON repair.
*   **Premium Tier**: Handles low-volume, high-complexity academic content such as concepts, formulas, and detailed examples.
*   **Provider Routing**: Provider choices are environment-driven and can route through OpenAI, Gemini-compatible, or OpenRouter-compatible clients.

### 4. Semantic Cache (Semantic Search)
*   Uses vector embeddings (via `local` or `openai` provider) to find similar historical requests.
*   Drastically reduces costs and generation time for common educational topics.

## Tech Stack
*   **Frontend**: Next.js 16, React 19, Tailwind CSS, Lucide Icons.
*   **Backend**: Node.js (ESM), Fastify, Prisma (PostgreSQL).
*   **Queue**: BullMQ, Redis.
*   **Rendering**: pptxgenjs.
*   **AI**: OpenAI SDK with OpenAI, Gemini-compatible, and OpenRouter-compatible routing.
