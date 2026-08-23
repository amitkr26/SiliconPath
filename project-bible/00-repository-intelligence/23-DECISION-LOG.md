# 23-DECISION-LOG — Architectural Decision Records (ADRs)

- **ADR-001: Modular Monolith Architecture**: Built as a cohesive Next.js 14 application on Vercel to maximize feature development velocity and eliminate microservice distributed tracing overhead.
- **ADR-002: Additive Backend Replication**: Express backend on Render replicates Next.js APIs without moving or deleting frontend route handlers.
- **ADR-003: Co-Aligned Opportunities Ownership**: Maintained both `created_by` and `employer_id` foreign keys in `opportunities` for backwards compatibility.
- **ADR-004: Multi-Provider LLM Fallback Cascade**: 9-provider fallback chain guarantees 99.99% uptime for AI features against individual provider outages.
