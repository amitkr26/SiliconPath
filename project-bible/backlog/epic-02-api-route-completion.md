# Epic 02: API Route Completion

**Priority**: P0 | **Estimated effort**: 8 days | **Dependencies**: Epic 07 (DB schema must be stable)

## Description

Implement the 14 missing API routes identified in the gap analysis. Complete the route catalog to reach the 74-route target specified in the Project Bible.

## Feature 2.1: Bookmarks API

### User Story 2.1.1
As a registered user, I want to bookmark opportunities so I can return to them later.

#### Task 2.1.1.1: Create GET /api/bookmarks
- **Description**: Implement route to list authenticated user's bookmarked opportunities. Returns paginated list of saved_opportunities with joined opportunity data
- **Dependencies**: Epic 07 (saved_opportunities table exists)
- **Acceptance Criteria**: Returns `{ data: SavedOpportunity[], count, page, pageSize }`. Filters by current user via auth.uid(). Empty array if none saved
- **Database changes**: None (table exists)
- **API changes**: New route `GET /api/bookmarks`
- **UI changes**: None
- **Testing requirements**: Test with 0, 1, and multiple bookmarks. Test unauthenticated returns 401
- **Documentation updates**: Add to route catalog in project-bible/07-api/

#### Task 2.1.1.2: Create POST /api/bookmarks
- **Description**: Implement route to save an opportunity. Accepts `{ opportunity_id: string }`. Validates opportunity exists. Prevents duplicates
- **Dependencies**: 2.1.1.1
- **Acceptance Criteria**: Returns 201 with created bookmark. Returns 409 if already bookmarked. Returns 404 if opportunity not found
- **Database changes**: None
- **API changes**: New route `POST /api/bookmarks`
- **UI changes**: None
- **Testing requirements**: Test create, duplicate, invalid opportunity_id
- **Documentation updates**: Add to route catalog

#### Task 2.1.1.3: Create DELETE /api/bookmarks/[id]
- **Description**: Implement route to remove a bookmark. Validates ownership (only the user who created it can delete)
- **Dependencies**: 2.1.1.1
- **Acceptance Criteria**: Returns 204 on success. Returns 404 if not found. Returns 403 if not owner
- **Database changes**: None
- **API changes**: New route `DELETE /api/bookmarks/[id]`
- **UI changes**: None
- **Testing requirements**: Test delete, wrong user, nonexistent id
- **Documentation updates**: Add to route catalog

## Feature 2.2: Resume API Completion

### User Story 2.2.1
As a user, I want to upload, update, and delete my resume.

#### Task 2.2.2.1: Create POST /api/resume/upload
- **Description**: Implement file upload route for resumes. Accept multipart/form-data with file. Store in GCP Storage. Save URL to resumes table
- **Dependencies**: Epic 07 (resumes table exists)
- **Acceptance Criteria**: Returns 201 with resume metadata. Rejects files > 10MB. Rejects non-PDF/docx
- **Database changes**: None
- **API changes**: New route `POST /api/resume/upload`
- **UI changes**: None
- **Testing requirements**: Test upload, invalid file type, too large
- **Documentation updates**: Add to route catalog

#### Task 2.2.2.2: Create PATCH /api/resume
- **Description**: Implement route to update resume metadata (name, default flag, visibility). Body validated with profileUpdateSchema
- **Dependencies**: 2.2.2.1
- **Acceptance Criteria**: Returns 200 with updated resume. Returns 404 if resume not found
- **Database changes**: None
- **API changes**: New route `PATCH /api/resume`
- **UI changes**: None
- **Testing requirements**: Test update fields, not found
- **Documentation updates**: Add to route catalog

#### Task 2.2.2.3: Create DELETE /api/resume
- **Description**: Implement route to delete a resume. Removes file from GCP Storage and row from resumes table
- **Dependencies**: 2.2.2.1
- **Acceptance Criteria**: Returns 204. File removed from storage. Row removed from DB
- **Database changes**: None
- **API changes**: New route `DELETE /api/resume`
- **UI changes**: None
- **Testing requirements**: Test delete, verify file removed
- **Documentation updates**: Add to route catalog

## Feature 2.3: Messages API Completion

### User Story 2.3.1
As a user, I want to send messages to my connections.

#### Task 2.3.3.1: Create POST /api/messages/send
- **Description**: Implement route to send a message. Accepts `{ conversation_id: string, content: string }`. Validates both users are in the conversation. Creates notification for recipient
- **Dependencies**: Epic 04 (messages table, conversation table)
- **Acceptance Criteria**: Returns 201 with created message. Returns 403 if user not in conversation. Returns 400 if content empty
- **Database changes**: None
- **API changes**: New route `POST /api/messages/send`
- **UI changes**: None
- **Testing requirements**: Test send, unauthorized, empty content
- **Documentation updates**: Add to route catalog

## Feature 2.4: Notifications API Completion

### User Story 2.4.1
As a user, I want to mark notifications as read.

#### Task 2.4.4.1: Create PATCH /api/notifications/read
- **Description**: Implement route to mark one or all notifications as read. Accepts `{ notification_id?: string }` — if omitted, marks all as read
- **Dependencies**: Epic 07 (notifications table exists)
- **Acceptance Criteria**: Returns 200 with `{ read_count: number }`. Only marks current user's notifications
- **Database changes**: None
- **API changes**: New route `PATCH /api/notifications/read`
- **UI changes**: None
- **Testing requirements**: Test mark single, mark all, no notifications
- **Documentation updates**: Add to route catalog

## Feature 2.5: Admin Routes

### User Story 2.5.1
As an admin, I want to verify, reject, and manage opportunities.

#### Task 2.5.5.1: Create POST /api/admin/opportunities/[id]/verify
- **Description**: Implement route to mark opportunity as verified. Changes verification_status to 'verified'. Admin auth required
- **Dependencies**: Epic 07
- **Acceptance Criteria**: Returns 200. Status changed to verified. Opportunity becomes public
- **Database changes**: None
- **API changes**: New route `POST /api/admin/opportunities/[id]/verify`
- **UI changes**: None
- **Testing requirements**: Test verify, non-admin returns 403
- **Documentation updates**: Add to admin route catalog

#### Task 2.5.5.2: Create POST /api/admin/opportunities/[id]/reject
- **Description**: Implement route to mark opportunity as rejected. Changes verification_status to 'rejected'. Accepts optional `reason: string`
- **Dependencies**: 2.5.5.1
- **Acceptance Criteria**: Returns 200. Status changed to rejected
- **Database changes**: None
- **API changes**: New route
- **Testing requirements**: Test reject with and without reason
- **Documentation updates**: Add to admin route catalog

## Feature 2.6: Academy API Completion

### User Story 2.6.1
As a student, I want to view day content and checkpoints for academy tracks.

#### Task 2.6.6.1: Create GET /api/academy/days/[trackId]/[dayNumber]
- **Description**: Implement route to fetch a specific day's content. Returns title, content, video_url, resources
- **Dependencies**: Epic 07 (academy_days table)
- **Acceptance Criteria**: Returns day content. Returns 404 if not found. Handles legacy table name fallback
- **Database changes**: None
- **API changes**: New route
- **UI changes**: None
- **Testing requirements**: Test valid day, invalid track, invalid day number
- **Documentation updates**: Add to route catalog

#### Task 2.6.6.2: Create GET /api/academy/checkpoints/[trackId]
- **Description**: Implement route to fetch assessment questions for a track. Returns questions from track_checkpoints
- **Dependencies**: Epic 07 (track_checkpoints table)
- **Acceptance Criteria**: Returns questions array. Returns 404 if track not found
- **Database changes**: None
- **API changes**: New route
- **UI changes**: None
- **Testing requirements**: Test valid track, track with no checkpoints
- **Documentation updates**: Add to route catalog

## Feature 2.7: Cron Routes

### User Story 2.7.1
As a platform operator, I want automated newsletter and cleanup tasks.

#### Task 2.7.7.1: Create POST /api/cron/newsletter
- **Description**: Implement monthly newsletter cron. Generates AI-curated newsletter from top opportunities + news. Sends via Resend to all subscribers
- **Dependencies**: Epic 06 (AI Gateway), Resend configured
- **Acceptance Criteria**: Newsletter generated and sent. Logs success/failure. Rate-limited to once per month
- **Database changes**: None
- **API changes**: New route, protected by CRON_SECRET
- **UI changes**: None
- **Testing requirements**: Test cron auth, verify Resend called
- **Documentation updates**: Add to cron schedule in project-bible/07-api/

#### Task 2.7.7.2: Create POST /api/cron/cleanup
- **Description**: Implement daily cleanup cron. Archives expired opportunities (past deadline). Removes opportunities with verification_status='rejected' older than 30 days
- **Dependencies**: Epic 07
- **Acceptance Criteria**: Expired opportunities archived or deleted. Logs count of affected rows
- **Database changes**: None
- **API changes**: New route, protected by CRON_SECRET
- **UI changes**: None
- **Testing requirements**: Test with expired opportunities
- **Documentation updates**: Add to cron schedule

## Feature 2.8: Public Stats Route

### User Story 2.8.1
As a visitor, I want to see platform statistics.

#### Task 2.8.8.1: Create GET /api/opportunities/stats
- **Description**: Implement route returning aggregate stats: total opportunities, total organizations, categories breakdown, newest opportunity date
- **Dependencies**: Epic 07
- **Acceptance Criteria**: Returns `{ total_opportunities, total_organizations, categories, last_updated }`. No auth required
- **Database changes**: None
- **API changes**: New public route
- **UI changes**: None (landing page can consume this)
- **Testing requirements**: Test returns valid stats with no data
- **Documentation updates**: Add to route catalog

## Master Execution Checklist — Epic 02

- [ ] 2.1.1.1 GET /api/bookmarks
- [ ] 2.1.1.2 POST /api/bookmarks
- [ ] 2.1.1.3 DELETE /api/bookmarks/[id]
- [ ] 2.2.2.1 POST /api/resume/upload
- [ ] 2.2.2.2 PATCH /api/resume
- [ ] 2.2.2.3 DELETE /api/resume
- [ ] 2.3.3.1 POST /api/messages/send
- [ ] 2.4.4.1 PATCH /api/notifications/read
- [ ] 2.5.5.1 POST /api/admin/opportunities/[id]/verify
- [ ] 2.5.5.2 POST /api/admin/opportunities/[id]/reject
- [ ] 2.6.6.2 GET /api/academy/days/[trackId]/[dayNumber]
- [ ] 2.6.6.3 GET /api/academy/checkpoints/[trackId]
- [ ] 2.7.7.1 POST /api/cron/newsletter
- [ ] 2.7.7.2 POST /api/cron/cleanup
- [ ] 2.8.8.1 GET /api/opportunities/stats
