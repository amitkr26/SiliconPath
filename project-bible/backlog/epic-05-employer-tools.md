# Epic 05: Employer Tools

**Priority**: P1 | **Estimated effort**: 24 days | **Dependencies**: Epic 02 (API routes), Epic 03 (UI components)

## Description

Build the employer platform — company profiles, job posting, application management, and candidate discovery. This enables organizations to recruit through BerojgarDegreeWala.

## Feature 5.1: Company Profiles

### User Story 5.1.1
As an employer, I want to create and manage my company profile.

#### Task 5.1.1.1: Build company profile page
- **Description**: Create /companies/[slug] page showing company info: logo, name, description, website, size, industry, location. List of open opportunities from this company. Social links
- **Dependencies**: Company API exists, company_profiles table exists
- **Acceptance Criteria**: Shows all company fields. Lists verified opportunities from this company. Loading skeleton. 404 if company not found. SEO meta tags
- **Database changes**: None
- **API changes**: None
- **UI changes**: New company detail page
- **Testing requirements**: Test with opportunities, without, 404
- **Documentation updates**: Add to project-bible/11-employers/

#### Task 5.1.1.2: Build company dashboard
- **Description**: Create employer dashboard at /dashboard/employer. Sections: company profile preview, opportunity management, applicant stats. Edit profile button. Uses existing profile/company APIs
- **Dependencies**: 5.1.1.1
- **Acceptance Criteria**: Shows company info with edit option. Lists posted opportunities with stats. Shows recent applicants count
- **Database changes**: None
- **API changes**: None
- **UI changes**: New employer dashboard layout
- **Testing requirements**: Test with complete profile, missing fields
- **Documentation updates**: Add to project-bible/11-employers/

#### Task 5.1.1.3: Build company claim flow
- **Description**: Company claim verification flow. User searches for company → claims it → admin verifies → gets employer badge. Verification badge on company profile
- **Dependencies**: 5.1.1.1
- **Acceptance Criteria**: Claim creates verification request. Admin sees pending claims. On approval, user gets employer role. Verified badge shown
- **Database changes**: May need `claimed_by` and `verified` columns on company_profiles
- **API changes**: New claim endpoint, admin verification endpoint
- **UI changes**: "Claim this company" button, verification badge
- **Testing requirements**: Test claim, admin approve/reject, badge visibility
- **Documentation updates**: Add to project-bible/11-employers/

## Feature 5.2: Job Posting

### User Story 5.2.1
As an employer, I want to post and manage job opportunities.

#### Task 5.2.2.1: Build job posting form
- **Description**: Create opportunity creation form for employers. Fields: title, description, type, category, location, stipend/salary, deadline, apply URL, requirements. Uses opportunitySchema for validation
- **Dependencies**: 5.1.1.2, validation.ts exists
- **Acceptance Criteria**: All fields render with correct input types. Validation shows inline errors. Submit creates opportunity as 'pending'. Preview before submit
- **Database changes**: None
- **API changes**: None
- **UI changes**: New posting form on employer dashboard
- **Testing requirements**: Test all fields, validation errors, submit
- **Documentation updates**: Add to project-bible/11-employers/

#### Task 5.2.2.2: Build job editing workflow
- **Description**: Edit/delete existing opportunities from employer dashboard. Edit pre-fills form. Delete with confirmation modal. Status management (close/reopen)
- **Dependencies**: 5.2.2.1
- **Acceptance Criteria**: Edit loads existing data. Save updates opportunity. Delete removes with confirmation. Close changes status without deleting
- **Database changes**: None
- **API changes**: None
- **UI changes**: Edit/delete buttons on employer dashboard opportunity list
- **Testing requirements**: Test edit save, delete, close, reopen
- **Documentation updates**: None

## Feature 5.3: Application Management

### User Story 5.3.1
As an employer, I want to review and manage applications.

#### Task 5.3.3.1: Build application review dashboard
- **Description**: Create applicant list for each opportunity. Shows: applicant name, title, applied date, status. Click expands details: cover letter, resume link, profile. Uses existing applications API
- **Dependencies**: 5.1.1.2, applications table exists
- **Acceptance Criteria**: Lists applicants for each opportunity. Status filter tabs (all/new/reviewed/shortlisted/rejected). Click expands full application
- **Database changes**: None
- **API changes**: None
- **UI changes**: Application review panel on employer dashboard
- **Testing requirements**: Test with applicants, empty, status filter
- **Documentation updates**: Add to project-bible/11-employers/

#### Task 5.3.3.2: Build application status workflow
- **Description**: Status action buttons on application detail: "Mark Reviewed", "Shortlist", "Reject" (with reason), "Accept". Each action updates status and creates notification for applicant. State machine: submitted → reviewed → shortlisted → accepted/rejected
- **Dependencies**: 5.3.3.1
- **Acceptance Criteria**: Status changes visually. Notification sent to applicant. Invalid transitions blocked. History log of status changes
- **Database changes**: None
- **API changes**: New PATCH /api/applications/[id]/status
- **UI changes**: Status action buttons on application detail
- **Testing requirements**: Test each transition, invalid transition, notification
- **Documentation updates**: Add to project-bible/11-employers/

#### Task 5.3.3.3: Build applicant notification system
- **Description**: When application status changes, create notification for applicant. Email notification for key statuses (shortlisted, accepted, rejected). In-app notification for all changes
- **Dependencies**: 5.3.3.2, 4.4.4.1
- **Acceptance Criteria**: Notification created on each status change. Email sent for shortlisted/accepted/rejected. Notification click navigates to application status page
- **Database changes**: None
- **API changes**: None
- **UI changes**: None (uses existing notification system)
- **Testing requirements**: Test notification for each status change
- **Documentation updates**: None

## Feature 5.4: Candidate Discovery

### User Story 5.4.1
As an employer, I want to discover and contact potential candidates.

#### Task 5.4.4.1: Build candidate search for employers
- **Description**: Create /employer/talent-pool page. Search/filter user profiles by: skills, experience years, academy track completions, location, current company. Results as ConnectionCards with "Connect" action
- **Dependencies**: 3.3.3.4 (ConnectionCard), People API exists
- **Acceptance Criteria**: Filters return matching profiles. Results paginated. Empty state for no matches. Connect button sends connection request
- **Database changes**: None
- **API changes**: May need new GET /api/employer/talent-pool endpoint
- **UI changes**: New talent pool page
- **Testing requirements**: Test filters, pagination, empty, connect action
- **Documentation updates**: Add to project-bible/11-employers/

#### Task 5.4.4.2: Build skill-based recommendations
- **Description**: AI-powered candidate recommendations. When posting an opportunity, suggest matching candidates based on skills and experience. Uses AI Gateway's matcher
- **Dependencies**: 5.4.4.1, Epic 06 (AI Gateway)
- **Acceptance Criteria**: After posting, shows suggested candidates. Each with match percentage. "Connect" button. "Dismiss suggestion"
- **Database changes**: None
- **API changes**: New endpoint or AI matcher integration
- **UI changes**: Suggested candidates section on opportunity detail
- **Testing requirements**: Test with matching candidates, no matches
- **Documentation updates**: Add to project-bible/11-employers/

## Master Execution Checklist — Epic 05

- [ ] 5.1.1.1 Company profile page
- [ ] 5.1.1.2 Employer dashboard
- [ ] 5.1.1.3 Company claim flow
- [ ] 5.2.2.1 Job posting form
- [ ] 5.2.2.2 Job editing workflow
- [ ] 5.3.3.1 Application review dashboard
- [ ] 5.3.3.2 Application status workflow
- [ ] 5.3.3.3 Applicant notification system
- [ ] 5.4.4.1 Candidate search for employers
- [ ] 5.4.4.2 Skill-based AI recommendations
