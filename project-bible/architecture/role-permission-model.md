# Role & Permission Architecture Model

**Platform**: BerojgarDegreeWala  
**Document Version**: 1.0 (Phase 30 RBAC Specification)  
**Author**: Antigravity Security & Architecture Team  

---

## 1. Unified Access Model Philosophy

Every user is an **Authenticated Identity** on BerojgarDegreeWala. Rather than segregating users into disconnected portals with mutually exclusive databases or authentication tokens, capabilities are progressive and additive:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATED IDENTITY                        │
│                                                                        │
│   ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────┐ │
│   │ Candidate Capability │  │ Employer Capability  │  │ Admin Scope │ │
│   │ • Profile            │  │ • Org Management     │  │ • Telemetry │ │
│   │ • Applications       │  │ • Job Postings       │  │ • Scrapers  │ │
│   │ • Social Network     │  │ • ATS Pipeline       │  │ • Audit     │ │
│   │ • AI Career Copilot  │  │ • Talent Sourcing    │  │             │ │
│   └──────────────────────┘  └──────────────────────┘  └─────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Permission Matrix

```typescript
export const ROLE_PERMISSIONS: Record<GlobalRole, Permission[]> = {
  owner: [
    "opportunities.read", "opportunities.apply", "opportunities.bookmark",
    "opportunities.create", "opportunities.verify", "opportunities.delete",
    "users.read", "users.manage", "organizations.manage", "organizations.verify",
    "scrapers.read", "scrapers.run", "analytics.read", "system.settings"
  ],
  platform_admin: [
    "opportunities.read", "opportunities.apply", "opportunities.bookmark",
    "opportunities.create", "opportunities.verify", "opportunities.delete",
    "users.read", "users.manage", "organizations.manage", "organizations.verify",
    "scrapers.read", "scrapers.run", "analytics.read"
  ],
  manager: [
    "opportunities.read", "opportunities.apply", "opportunities.bookmark",
    "opportunities.verify", "scrapers.read", "scrapers.run"
  ],
  moderator: [
    "opportunities.read", "opportunities.apply", "opportunities.bookmark",
    "content.moderate"
  ],
  support: [
    "opportunities.read", "opportunities.apply", "opportunities.bookmark",
    "users.read"
  ],
  user: [
    "opportunities.read", "opportunities.apply", "opportunities.bookmark"
  ]
};
```

---

## 3. Reusable Authorization Helpers

The authorization library provides server-side and client-side helpers:

```typescript
// Server-side Route Handler Guard
import { requirePermission, hasPermission } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const user = await requirePermission(request, "opportunities.create");
  // Proceed with authorized mutation
}
```

```typescript
// React Component Conditional Rendering
import { usePermissions } from "@/hooks/usePermissions";

export function JobActionButtons() {
  const { can } = usePermissions();
  return (
    <div>
      {can("opportunities.create") && <PostJobButton />}
      {can("opportunities.verify") && <VerifyJobButton />}
    </div>
  );
}
```

---

## 4. Manager Assignment Workflow

1. **Owner Access**: Only an authenticated user with `system.settings` (Owner) can assign or modify platform staff roles.
2. **Target User Selection**: The owner selects an existing registered user by username or email.
3. **Scope Assignment**: The owner checks specific permission bundles (e.g. `Opportunity Verification`, `Scraper Ingestion`).
4. **Audit Persistence**: The action is logged to `audit_logs` with `(actor_id, action='assign_manager', target_id, permissions)`.
