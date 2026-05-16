# Savra Cost Analysis And Optimization Report

## Executive Summary

The architecture is designed to reduce average presentation cost from about INR 15 per PPT to about INR 4-5 per PPT by avoiding repeated LLM work, routing tasks by complexity, and repairing malformed JSON instead of regenerating full decks.

## Cost Controls

### Semantic Cache

Before a generation job enters the queue, the API checks for an exact request hash and then a semantic match with grade and subject guards. Repeated school topics can return an existing PPT URL without running the full AI pipeline again.

Expected impact:

- Common educational topics can become near-zero-cost cache hits.
- Cache hits avoid outline generation, slide generation, JSON repair, and PPT rendering.
- Grade and subject checks reduce incorrect reuse.

### Smart Model Routing

The system separates work into cheap and premium tiers. Provider choices are environment-driven through `LLM_CHEAP_PROVIDER` and `LLM_PREMIUM_PROVIDER`.

Cheap tier work:

- outlines
- summaries
- quizzes
- activities
- JSON repair

Premium tier work:

- concept explanations
- formulas
- detailed examples

This keeps high-volume calls on lower-cost models while reserving stronger models for slides where explanation quality matters most.

### JSON Validation And Targeted Repair

Blind retries can waste the entire prompt and output budget. Savra validates every LLM response with Zod and sends focused repair prompts with validation errors when the JSON is malformed.

Expected impact:

- lower retry cost
- fewer failed jobs
- smaller recovery scope
- less duplicated token usage

## Unit Economics Estimate

| Component | Baseline Estimate | Optimized Estimate |
| :--- | :--- | :--- |
| Input and planning tokens | INR 6.00 | INR 1.80 |
| Slide output tokens | INR 8.00 | INR 2.20 |
| Infra per PPT at scale | INR 1.00 | INR 0.20 |
| Total per PPT | INR 15.00 | INR 4.20 |

## Monthly Scale Estimate

At 40,000 PPTs per month:

- Baseline spend: about INR 6,00,000 per month
- Optimized spend: about INR 1,68,000 per month
- Estimated savings: about INR 4,32,000 per month

## Tradeoff

The estimate depends on cache hit rate, provider pricing, average slide count, and model mix. The architecture keeps these variables configurable so the system can tune cost without changing core code.
