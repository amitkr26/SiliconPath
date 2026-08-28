# AI Career Copilot Architecture

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30C Grounded Intelligence Model)  
**Author**: Antigravity AI & Career Intelligence Team  

---

## 1. Grounded Intelligence Mandate

Traditional chatbots hallucinate fictional job openings or invent requirements. BerojgarDegreeWala's AI Career Copilot adheres strictly to the **Grounded Database Truth Mandate**:
- All recommendations, eligibility explanations, and career pathways must reference live PostgreSQL records in `opportunities`, `user_profiles`, and `news_articles`.
- No synthetic opportunities may be output to users.

---

## 2. Retrieval-Augmented Query Pipeline

```mermaid
flowchart TD
    UserQuery[Candidate Query: e.g. What skills do I need for ISRO JRF?] --> IntentDetect[Intent Detection & Entity Parsing]
    IntentDetect --> RetrieveDB[(Retrieve Real Records from Supabase)]
    RetrieveDB --> Match[Extract Candidate Skills & Requirements]
    Match --> GroundedPrompt[Construct Grounded Context Prompt]
    GroundedPrompt --> LLM[Inference with System Safety Guardrails]
    LLM --> StructuredResp[Structured Response with Verifiable Database Citations]
    StructuredResp --> ClientUI[Render in AI Career Copilot Console]
```

---

## 3. Privacy & Cross-User Isolation

1. **User Scope Isolation**: AI endpoints (`/api/ai/*`) only access the authenticated user's resume, applications, and saved jobs (`WHERE user_id = auth.uid()`).
2. **Zero Sensitive Leakage**: Admin settings, service role keys, and private employer notes are strictly excluded from AI prompts.
