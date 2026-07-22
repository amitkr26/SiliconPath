# Epic 04: Social & Engagement Features

**Priority**: P1 | **Estimated effort**: 28 days | **Dependencies**: Epic 02 (API routes), Epic 03 (UI components)

## Description

Build the BerojgarDegreeWala Network — feed, connections, messaging, notifications, and bookmark management. This enables user-to-user interaction and platform engagement.

## Feature 4.1: Feed & Community

### User Story 4.1.1
As a user, I want to create and engage with feed posts.

#### Task 4.1.1.1: Build feed post creation UI
- **Description**: Create post composer component. Text input with expandable textarea. Character counter. Submit button. Attachments placeholder. Props: `onSubmit: (content: string) => Promise<void>`. Uses FeedPost component for display
- **Dependencies**: 3.3.3.7 (FeedPost), Feed API exists
- **Acceptance Criteria**: User can type and submit post. Posts appear in feed. Character limit enforced. Empty submit disabled. Loading state during submit
- **Database changes**: None
- **API changes**: None (uses existing POST /api/feed)
- **UI changes**: New post composer on /feed page
- **Testing requirements**: Test submit, empty, long content, loading state
- **Documentation updates**: Add to project-bible/12-users/

#### Task 4.1.1.2: Build feed post engagement UI
- **Description**: Wire up like, comment, repost buttons on FeedPost component. Comment expands inline textarea. Like toggles. Repost creates new post. Use existing API routes
- **Dependencies**: 3.3.3.7, Feed API routes exist
- **Acceptance Criteria**: Like count updates optimistically. Comment form expands. Repost creates new post. All actions update in real-time
- **Database changes**: None
- **API changes**: None
- **UI changes**: Wire up existing FeedPost engagement buttons
- **Testing requirements**: Test like/unlike, comment submit, repost, error handling
- **Documentation updates**: None

#### Task 4.1.1.3: Build feed infinite scroll
- **Description**: Implement intersection observer for infinite scroll on feed. Load more posts when user scrolls near bottom. Replace page-based pagination with cursor-based
- **Dependencies**: 4.1.1.1
- **Acceptance Criteria**: New posts load on scroll. Loading indicator at bottom. "No more posts" message at end. Works with back button
- **Database changes**: None
- **API changes**: May need cursor parameter on feed API
- **UI changes**: Infinite scroll on /feed
- **Testing requirements**: Test scroll load, end reached, error during load
- **Documentation updates**: None

## Feature 4.2: Connections & Networking

### User Story 4.2.1
As a user, I want to connect with other VLSI professionals.

#### Task 4.2.2.1: Build connection request UI
- **Description**: Create connection request flow. "Connect" button on ConnectionCard and user profile. Dropdown with "Connect" / "Pending" / "Connected" / "Accept" states. Uses existing API routes
- **Dependencies**: 3.3.3.4 (ConnectionCard), Network API exists
- **Acceptance Criteria**: Button shows correct state. Connect sends request. Accept/Reject works from notifications. Pending shows on recipient's end
- **Database changes**: None
- **API changes**: None
- **UI changes**: Connect button on ConnectionCard, profile pages
- **Testing requirements**: Test all states, cancel request, reject notification
- **Documentation updates**: Add to project-bible/12-users/

#### Task 4.2.2.2: Build connection suggestions
- **Description**: Create "People you may know" section. Uses /api/network/suggestions. Shows 5 ConnectionCards. "See all" link. Dismiss button. Suggestions based on shared skills, organizations, connections
- **Dependencies**: 3.3.3.4, Network API exists
- **Acceptance Criteria**: Shows relevant suggestions. Dismiss removes card. "See all" navigates to /network. Empty state when no suggestions
- **Database changes**: None
- **API changes**: None
- **UI changes**: Suggestions sidebar on /network and /feed
- **Testing requirements**: Test with suggestions, empty, dismiss
- **Documentation updates**: None

#### Task 4.2.2.3: Build people search UI
- **Description**: Create search interface for /people page. Search bar with debounce. Results as ConnectionCards. Filters: skills, company, location. Uses /api/people/search
- **Dependencies**: 3.3.3.4, People API exists
- **Acceptance Criteria**: Search returns results after 300ms debounce. Filters narrow results. Empty state for no results. Loading skeleton
- **Database changes**: None
- **API changes**: None
- **UI changes**: New /people page with search and filters
- **Testing requirements**: Test search, filter combination, empty results
- **Documentation updates**: Add to project-bible/03-ui/

## Feature 4.3: Messaging

### User Story 4.3.1
As a user, I want to message my connections.

#### Task 4.3.3.1: Build conversation list UI
- **Description**: Create sidebar conversation list for /messages. Shows avatars, last message preview, timestamp, unread count. Sorted by most recent. Uses existing GET /api/messages/conversations
- **Dependencies**: 3.3.3.5 (MessageThread), Message API exists
- **Acceptance Criteria**: Lists conversations. Unread count badge. Tap navigates to thread. Empty state for no conversations
- **Database changes**: None
- **API changes**: None
- **UI changes**: New /messages page with conversation list sidebar
- **Testing requirements**: Test with conversations, empty, unread indicators
- **Documentation updates**: Add to project-bible/12-users/

#### Task 4.3.3.2: Build message thread UI
- **Description**: Integrate MessageThread component into /messages. Wire send button to POST /api/messages/send (once created in Epic 02). Auto-poll every 5s for new messages (or WebSocket if implemented)
- **Dependencies**: 3.3.3.5, 2.3.3.1 (POST /api/messages/send)
- **Acceptance Criteria**: Messages display in correct order. New messages appear without page reload. Send works. Typing indicator placeholder
- **Database changes**: None
- **API changes**: None
- **UI changes**: Message thread on /messages
- **Testing requirements**: Test send, receive, polling, empty conversation
- **Documentation updates**: None

#### Task 4.3.3.3: Build new conversation flow
- **Description**: "New message" button opens user search modal. Select user creates conversation. Navigates to new thread. First message sends creates conversation
- **Dependencies**: 4.3.3.1, 4.2.2.3
- **Acceptance Criteria**: Can search and select user. New conversation created. First message sent
- **Database changes**: None
- **API changes**: None
- **UI changes**: New message modal on /messages
- **Testing requirements**: Test create conversation, send first message
- **Documentation updates**: None

## Feature 4.4: Notifications

### User Story 4.4.1
As a user, I want a notification center.

#### Task 4.4.4.1: Build notification center UI
- **Description**: Create /notifications page using NotificationItem component. Group by date. "Mark all as read" button. Uses existing GET /api/notifications and 2.4.4.1 (PATCH read). Bell icon in header with unread count
- **Dependencies**: 3.3.3.6, 2.4.4.1
- **Acceptance Criteria**: Lists notifications grouped by date. Unread count in header. Mark all as read works. Each item clickable with context-appropriate action
- **Database changes**: None
- **API changes**: None
- **UI changes**: New /notifications page, bell icon in Navbar
- **Testing requirements**: Test empty, mixed read/unread, mark all, click action
- **Documentation updates**: Add to project-bible/12-users/

## Feature 4.5: Bookmarks

### User Story 4.5.1
As a user, I want to save and organize opportunities.

#### Task 4.5.5.1: Build bookmark button on opportunities
- **Description**: Add bookmark (bookmark/outline) icon to OpportunityCard and OpportunityRow. Uses POST /api/bookmarks. Toggle state. Tooltip "Save" / "Saved". Heart icon animation
- **Dependencies**: 2.1.1.2 (POST /api/bookmarks), 2.1.1.3 (DELETE)
- **Acceptance Criteria**: Click bookmarks opportunity. Icon fills. Click again removes. Loading state during API call. Error toast on failure
- **Database changes**: None
- **API changes**: None
- **UI changes**: Bookmark button on opportunity cards and detail page
- **Testing requirements**: Test add, remove, toggle, error state
- **Documentation updates**: Add to project-bible/12-users/

#### Task 4.5.5.2: Build saved opportunities page
- **Description**: Create /bookmarks page showing saved opportunities as a list. Uses GET /api/bookmarks. EmptyState if none. Pagination. Filter by category
- **Dependencies**: 2.1.1.1 (GET /api/bookmarks), 3.2.2.5 (EmptyState)
- **Acceptance Criteria**: Shows saved opportunities. Empty state when none. Remove bookmark from this page. Paginated
- **Database changes**: None
- **API changes**: None
- **UI changes**: New /bookmarks page
- **Testing requirements**: Test with bookmarks, empty, remove from page
- **Documentation updates**: Add to project-bible/03-ui/

## Feature 4.6: Onboarding Flow

### User Story 4.6.1
As a new user, I want a guided onboarding experience.

#### Task 4.6.6.1: Build onboarding wizard
- **Description**: Multi-step onboarding form on /onboarding. Steps: (1) Profile basics (name, title), (2) Skills selection, (3) Interests (categories), (4) Connections import/suggestions. Progress bar. Save on each step
- **Dependencies**: Profile API exists
- **Acceptance Criteria**: All steps navigable forward/backward. Progress bar updates. Save persists to profile. Skip option on each step. Redirect to /feed on completion
- **Database changes**: None
- **API changes**: None
- **UI changes**: New onboarding wizard replacing placeholder
- **Testing requirements**: Test all steps, skip, back/forward, save
- **Documentation updates**: Add to project-bible/12-users/

## Master Execution Checklist — Epic 04

- [ ] 4.1.1.1 Feed post creation UI
- [ ] 4.1.1.2 Feed post engagement UI
- [ ] 4.1.1.3 Feed infinite scroll
- [ ] 4.2.2.1 Connection request UI
- [ ] 4.2.2.2 Connection suggestions
- [ ] 4.2.2.3 People search UI
- [ ] 4.3.3.1 Conversation list UI
- [ ] 4.3.3.2 Message thread UI
- [ ] 4.3.3.3 New conversation flow
- [ ] 4.4.4.1 Notification center UI
- [ ] 4.5.5.1 Bookmark button on opportunities
- [ ] 4.5.5.2 Saved opportunities page
- [ ] 4.6.6.1 Onboarding wizard
