# PHASE 9: CANDIDATE PROFESSIONAL IDENTITY & NETWORKING PLAN

**Status**: Planning & Architecture Review  
**Target Release**: Phase 9  
**Platform**: BerojgarDegreeWala / SiliconPath  

---

## 1. Executive Summary & Objectives

Transform the Candidate Portal into a high-utility professional identity and networking platform tailored for semiconductor, VLSI, embedded systems, research, and high-tech engineering professionals.

The candidate ecosystem shifts from a simple job seeker form into a complete professional presence:
1. **Professional Candidate Identity**: Comprehensive profile with education, experience, projects, skills, certifications, achievements, portfolio links, open-to-work status, and career preferences.
2. **Dynamic Profile Completeness**: Transparent, deterministic 0–100% calculation based exclusively on persisted database entities (no fakes/placeholders).
3. **Professional Networking Graph**: Mutual connections, follow/unfollow, connection requests (send, accept, decline, withdraw, remove), and followers/following counts.
4. **Deterministic People-You-May-Know**: Explainable recommendation algorithm based on shared skills, mutual connections, organizations, and location.
5. **Integrated Messaging & Notifications**: Seamless bridge to existing `/messages` and `/notifications` infrastructure without duplicate tables.
6. **Employer Talent Discovery Compatibility**: Employers can view candidates' professional credentials, skills, and projects while enforcing candidate privacy and RLS.

---

## 2. Forensic Codebase Inspection & Reusability Audit

| Functional Area | Existing Assets | Reusability Verdict | Missing / Action Required |
| :--- | :--- | :--- | :--- |
| **User Profiles** | `user_profiles` table, `/api/profile/me`, `/api/profile/[userId]` | **100% Reusable** | Add career preference fields (`preferred_roles`, `preferred_locations`, `target_salary`, `work_mode`) if needed or create specialized child tables. |
| **Username Identity** | Unique lower index `user_profiles_username_lower_key`, `/api/auth/check-username`, `RESERVED_USERNAMES` | **100% Reusable** | Keep strictly preserved. |
| **Experience** | Not in dedicated relational table (only `job_title` / `current_company` string in `user_profiles`) | **New Relational Table** | Create `candidate_experiences` with CRUD APIs & RLS. |
| **Education** | Not in dedicated relational table | **New Relational Table** | Create `candidate_educations` with CRUD APIs & RLS. |
| **Projects** | Not in dedicated relational table | **New Relational Table** | Create `candidate_projects` with CRUD APIs & RLS. |
| **Certifications & Achievements** | Not in dedicated relational table | **New Relational Table** | Create `candidate_certifications` & `candidate_achievements` with CRUD APIs & RLS. |
| **Connections Graph** | `connections` table (requester_id, addressee_id, status), `/api/network/connect`, `/api/network/connections` | **85% Reusable** | Add `DELETE` /api/network/connections to support disconnect/unconnect, and mutual connection counting. |
| **Follow System** | `user_follows` table, `/api/network/follow/[userId]`, `/api/network/followers`, `/api/network/following` | **100% Reusable** | Wire into UI profile header and network followers/following views. |
| **Recommendations** | `recommendations` & `skill_endorsements` tables | **100% Reusable** | Surface dynamically in Candidate Profile view. |
| **Messaging Integration** | `conversations`, `messages`, `/api/messages` | **100% Reusable** | Connect Candidate Profile "Message" button directly to `/messages?userId=...` / conversation launcher. |
| **Notifications** | `notifications` table, `/api/notifications` | **100% Reusable** | Wire connection requests, acceptances, and follows to emit real notifications. |
| **Talent Search** | `/employer/talent`, `/api/employer/talent`, `/api/employer/talent/[username]` | **100% Reusable** | Expand candidate profile payload to include related experiences, educations, and projects for employers. |

---

## 3. Relational Database Design & Schema Architecture

All candidate child entities follow strict relational standards:
- **Foreign Key**: `candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE`
- **Primary Key**: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- **Timestamps**: `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`
- **Row Level Security (RLS)**:
  - **SELECT**: Visible to everyone if owning `user_profiles.is_profile_public = true`, or if `auth.uid() = candidate_id`.
  - **INSERT / UPDATE / DELETE**: Restricted strictly to `auth.uid() = candidate_id` (service role has full access).

### Proposed Tables:

```sql
-- 1. Candidate Experiences
CREATE TABLE IF NOT EXISTS candidate_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  role_title text NOT NULL,
  employment_type text DEFAULT 'Full-time' CHECK (employment_type IN ('Full-time', 'Part-time', 'Internship', 'Contract', 'Research', 'Apprenticeship')),
  location text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  skills_used text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT check_current_end_date CHECK (
    (is_current = true AND end_date IS NULL) OR
    (is_current = false)
  )
);

-- 2. Candidate Educations
CREATE TABLE IF NOT EXISTS candidate_educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  institution text NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  start_year integer,
  end_year integer,
  grade text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Candidate Projects
CREATE TABLE IF NOT EXISTS candidate_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  technologies text[] DEFAULT '{}',
  project_url text,
  github_url text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Candidate Certifications
CREATE TABLE IF NOT EXISTS candidate_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuing_org text NOT NULL,
  issue_date date,
  expiration_date date,
  credential_id text,
  credential_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Candidate Achievements
CREATE TABLE IF NOT EXISTS candidate_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  issuer text,
  date_awarded date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## 4. API Design Specification

### A. Candidate Profile Sub-Resource APIs
- `GET /api/profile/[userId]/experience` — List experiences for a profile
- `POST /api/profile/me/experience` — Add experience item
- `PATCH /api/profile/me/experience/[id]` — Edit experience item (enforces candidate ownership)
- `DELETE /api/profile/me/experience/[id]` — Delete experience item (enforces candidate ownership)

- `GET /api/profile/[userId]/education` — List education records
- `POST /api/profile/me/education` — Add education record
- `PATCH /api/profile/me/education/[id]` — Edit education record
- `DELETE /api/profile/me/education/[id]` — Delete education record

- `GET /api/profile/[userId]/projects` — List candidate projects
- `POST /api/profile/me/projects` — Add project
- `PATCH /api/profile/me/projects/[id]` — Edit project
- `DELETE /api/profile/me/projects/[id]` — Delete project

- `GET /api/profile/[userId]/certifications` — List certifications
- `POST /api/profile/me/certifications` — Add certification
- `DELETE /api/profile/me/certifications/[id]` — Delete certification

- `GET /api/profile/[userId]/achievements` — List achievements
- `POST /api/profile/me/achievements` — Add achievement
- `DELETE /api/profile/me/achievements/[id]` — Delete achievement

### B. Network & Connection Graph APIs
- `GET /api/network/connections` — Fetch accepted connections (with optional search filter `?q=`)
- `DELETE /api/network/connections` — Disconnect / remove connection (`body: { targetUserId: string }`)
- `GET /api/network/mutual` — Get mutual connections between viewer and profile (`?targetUserId=...`)
- `GET /api/network/suggestions` — Deterministic score-based people recommendations
- `POST /api/network/connect` — Send connection request
- `PATCH /api/network/connect/[id]` — Accept / Decline / Withdraw connection request
- `GET /api/network/followers` & `GET /api/network/following` — List followers & following
- `POST /api/network/follow/[userId]` & `DELETE /api/network/follow/[userId]` — Follow / Unfollow

---

## 5. Deterministic Profile Completeness Algorithm

Profile completeness is computed on the fly from persisted DB records (0 to 100%):

| Category | Criteria | Weight |
| :--- | :--- | :--- |
| **Basic Identity** | `display_name` + `username` + `headline` | 15% |
| **Avatar / Photo** | `avatar_url` present | 10% |
| **About / Bio** | `bio` >= 50 characters | 10% |
| **Location** | `location` present | 5% |
| **Skills** | `skills` array has >= 3 items | 15% |
| **Experience** | >= 1 item in `candidate_experiences` | 15% |
| **Education** | >= 1 item in `candidate_educations` | 15% |
| **Projects / Portfolio** | >= 1 item in `candidate_projects` OR `github_url` / `website_url` | 10% |
| **Career Preferences** | `is_open_to_work` set or open to work types configured | 5% |
| **Total** | | **100%** |

---

## 6. Mutual Connections & Deterministic Discovery

### Mutual Connections Calculation:
Let $U_A$ be user A and $U_B$ be user B.  
Connections set $C(U_A) = \{ v \mid (U_A, v) \in \text{accepted\_connections} \}$.  
Mutual connections set $M(U_A, U_B) = C(U_A) \cap C(U_B)$.  
Mutual count $= |M(U_A, U_B)|$.

### Deterministic People You May Know Scoring:
For each candidate $C \notin C(U_{me}) \cup \{ U_{me} \}$:
1. **Mutual Connections**: $+20$ points per mutual connection.
2. **Current Company / Org**: $+15$ points if $C.\text{company} = U_{me}.\text{company}$.
3. **Location / City**: $+10$ points if $C.\text{location} = U_{me}.\text{location}$.
4. **Shared Domain Skills**: $+5$ points per matching skill in `skills` array.
5. **Profile Completeness**: $+5$ points if completeness $\ge 80\%$.

---

## 7. UI / UX Experience & Responsive Design System

1. **Public Profile (`/profile/[username]` & `/people/[username]`)**:
   - Hero Header: Banner, Avatar, Full Name, Verified Badge, Username, Headline, Location, Current Position, Mutual Connections, Followers Count.
   - Relationship Action Bar: Connect / Pending / Connected, Follow / Following, Direct Message, Share Profile, Edit Profile (if owner).
   - Profile Completeness Indicator (owner view).
   - About Section.
   - Experience Timeline with organization, role, dates, description, and skill badges.
   - Education Section with degree, institution, and years.
   - Projects Showcase with tech tags and external links (GitHub, live demo).
   - Skills & Endorsements grid.
   - Certifications & Achievements list.
   - Recommendations carousel / feed.

2. **Network Hub (`/network`)**:
   - Tabbed Navigation: `Suggested Connections`, `Received Requests`, `Sent Requests`, `My Connections`, `Followers`, `Following`.
   - Real-time search filter for connections.
   - People You May Know cards with mutual connection badges and reason highlights ("3 mutual skills", "Same company").

---

## 8. Verification & Forensic E2E Suite Plan

A dedicated test suite `frontend/scripts/candidate-network-e2e.mjs` will verify:
1. Candidate profile updates and username case-insensitivity.
2. Experience CRUD (add, update, delete) and date validation.
3. Education CRUD (add, update, delete).
4. Project CRUD (add, update, delete).
5. Dynamic Profile Completeness score calculation (0% -> 100%).
6. Connection request lifecycle:
   - Candidate A sends request to Candidate B (notification emitted).
   - Candidate B accepts request (connection confirmed, follower/connection counts incremented).
   - Candidate A views mutual connections with Candidate C.
7. Follow / Unfollow lifecycle:
   - Candidate A follows Candidate B -> B sees follower -> A unfollows.
8. Direct Messaging trigger:
   - Connection initiates direct message -> conversation and messages verified in database.
9. Security & Attack Gates:
   - Candidate B attempting to PATCH/DELETE Candidate A's experience/education/projects -> 403 Forbidden.
   - Anonymous user attempting mutations -> 401 Unauthorized.
   - Self-connection and self-follow -> 400 Bad Request.
   - Duplicate connection requests -> 409 Conflict.
10. Full Regression:
    - Employer forensic suite (15/15 gates) remains 100% passing.
    - Jest unit tests (117/117) and TypeScript (0 errors) passing.
