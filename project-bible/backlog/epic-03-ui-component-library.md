# Epic 03: UI Component Library

**Priority**: P0 | **Estimated effort**: 10 days | **Dependencies**: None (pure UI)

## Description

Build the missing 46 UI components defined in the Project Bible's component catalog. Implement error boundaries for all route groups. This epic is high priority because components are prerequisites for all feature work.

## Feature 3.1: Core Navigation Components

### User Story 3.1.1
As a user, I want consistent navigation elements across the platform.

#### Task 3.1.1.1: Build Sidebar component
- **Description**: Create collapsible sidebar for filter panels on/opportunities and other list pages. Props: `isOpen`, `onToggle`, `children`. Responsive: slide-over on mobile, persistent on desktop
- **Dependencies**: None
- **Acceptance Criteria**: Sidebar collapses/expands. Animates smoothly. Mobile: overlay + close button. Desktop: inline
- **Database changes**: None
- **API changes**: None
- **UI changes**: New Sidebar component, integrate with opportunity filters
- **Testing requirements**: Test open/close states, responsive behavior
- **Documentation updates**: Add to component catalog

#### Task 3.1.1.2: Build Breadcrumb component
- **Description**: Create breadcrumb navigation component. Props: `items: { label: string, href?: string }[]`. Auto-generates from pathname if no items provided
- **Dependencies**: None
- **Acceptance Criteria**: Renders breadcrumb trail. Last item is plain text (current page). Items before are links. Shows home icon for root
- **Database changes**: None
- **API changes**: None
- **UI changes**: New Breadcrumb, integrate into all page layouts
- **Testing requirements**: Test with 2, 3, 4+ items, single item
- **Documentation updates**: Add to component catalog

## Feature 3.2: Core UI Components

### User Story 3.2.1
As a user, I want polished, consistent UI elements.

#### Task 3.2.2.1: Build Tabs component
- **Description**: Create tab navigation component. Props: `tabs: { id, label, content, disabled? }[]`, `defaultTab`, `onChange`. Accessible: ARIA tab role, keyboard navigation
- **Dependencies**: None
- **Acceptance Criteria**: Tabs switch content. Disabled tabs cannot be selected. Keyboard: arrow keys navigate
- **Database changes**: None
- **API changes**: None
- **UI changes**: New Tabs, integrate into profile, academy pages
- **Testing requirements**: Test tab switching, disabled tab, keyboard nav
- **Documentation updates**: Add to component catalog

#### Task 3.2.2.2: Build Tooltip component
- **Description**: Create hover tooltip. Props: `content: string | ReactNode`, `position: 'top'|'bottom'|'left'|'right'`, `delay?: number`. Uses portal to avoid overflow clipping
- **Dependencies**: None
- **Acceptance Criteria**: Tooltip appears on hover after delay. Disappears on mouse leave. Positions correctly near viewport edges
- **Database changes**: None
- **API changes**: None
- **UI changes**: New Tooltip
- **Testing requirements**: Test all positions, edge of viewport
- **Documentation updates**: Add to component catalog

#### Task 3.2.2.3: Build Dropdown component
- **Description**: Create dropdown menu component. Props: `trigger: ReactNode`, `items: { label, onClick, icon?, disabled?, divider? }[]`. Closes on click outside. Accessible: ARIA menu pattern
- **Dependencies**: None
- **Acceptance Criteria**: Dropdown opens/closes. Click outside closes. Items with onClick fire. Disabled items grayed out
- **Database changes**: None
- **API changes**: None
- **UI changes**: New Dropdown
- **Testing requirements**: Test open/close, item click, disabled item, keyboard
- **Documentation updates**: Add to component catalog

#### Task 3.2.2.4: Build Pagination component
- **Description**: Create pagination component. Props: `currentPage`, `totalPages`, `onPageChange`, `siblingCount?: number`. Shows: first, prev, page numbers with ellipsis, next, last
- **Dependencies**: None
- **Acceptance Criteria**: Renders correct page numbers with ellipsis. Disables prev on first page. Disables next on last page. Fires onPageChange
- **Database changes**: None
- **API changes**: None
- **UI changes**: New Pagination, integrate into opportunities list, admin tables
- **Testing requirements**: Test 1 page, many pages, edge pages selected
- **Documentation updates**: Add to component catalog

#### Task 3.2.2.5: Build EmptyState component
- **Description**: Create empty state placeholder. Props: `icon?: LucideIcon`, `title: string`, `description?: string`, `action?: { label, onClick }`. Centered layout with optional CTA button
- **Dependencies**: None
- **Acceptance Criteria**: Renders icon, title, description, CTA. Accessible: role="status"
- **Database changes**: None
- **API changes**: None
- **UI changes**: Replace inline empty states with component
- **Testing requirements**: Test with and without action, long text
- **Documentation updates**: Add to component catalog

#### Task 3.2.2.6: Build ErrorState component
- **Description**: Create error display component. Props: `error?: Error`, `title?: string`, `retry?: () => void`. Shows error icon, title, message, retry button
- **Dependencies**: None
- **Acceptance Criteria**: Renders error info. Retry button calls retry fn. Hides technical details in production
- **Database changes**: None
- **API changes**: None
- **UI changes**: Replace inline error displays
- **Testing requirements**: Test with and without retry, production mode
- **Documentation updates**: Add to component catalog

## Feature 3.3: Domain Components

### User Story 3.3.1
As a user, I want rich domain-specific UI components.

#### Task 3.3.3.1: Build OpportunityFilters component
- **Description**: Create filter panel for opportunities. Includes: category multi-select, type checkboxes, location input, date range. Uses the Sidebar component. Props: `filters: FilterState`, `onChange: (filters) => void`, `results: number`
- **Dependencies**: 3.1.1.1
- **Acceptance Criteria**: Each filter updates state. Results count updates. Reset button clears all. Active filter count badge on sidebar toggle
- **Database changes**: None
- **API changes**: None
- **UI changes**: New OpportunityFilters, replace inline filter code on /opportunities
- **Testing requirements**: Test each filter type, reset, combined filters
- **Documentation updates**: Add to component catalog

#### Task 3.3.3.2: Build AdminTable component
- **Description**: Create admin data table. Props: `columns: Column[]`, `data: Row[]`, `actions?: Action[]`, `sortable?: boolean`, `paginated?: boolean`. Supports sorting, filtering, row selection, bulk actions
- **Dependencies**: 3.2.2.4
- **Acceptance Criteria**: Renders table with headers. Sortable columns toggle sort direction. Row selection with check all
- **Database changes**: None
- **API changes**: None
- **UI changes**: New AdminTable
- **Testing requirements**: Test sort, select all, pagination, empty data
- **Documentation updates**: Add to component catalog

#### Task 3.3.3.3: Build ScrapeHealthCard component
- **Description**: Create scraper health status card. Props: `source: { name, lastRun, status, count, errors }`. Shows status indicator, last run time, opportunity count, error count
- **Dependencies**: None
- **Acceptance Criteria**: Green/yellow/red status dot. Timestamps formatted relative. Error count links to error log
- **Database changes**: None
- **API changes**: None
- **UI changes**: New ScrapeHealthCard
- **Testing requirements**: Test all status colors, missing data
- **Documentation updates**: Add to component catalog

#### Task 3.3.3.4: Build ConnectionCard component
- **Description**: Create user/connection card. Props: `user: UserProfile`, `mutualConnections?: number`, `actions?: ('connect'|'message'|'remove')[]`. Shows avatar, name, title, mutual connections, action buttons
- **Dependencies**: None
- **Acceptance Criteria**: Renders user info. Action buttons fire callbacks. Mutual connections shown if > 0
- **Database changes**: None
- **API changes**: None
- **UI changes**: New ConnectionCard
- **Testing requirements**: Test with/without actions, with/without mutual
- **Documentation updates**: Add to component catalog

#### Task 3.3.3.5: Build MessageThread component
- **Description**: Create message thread display. Props: `messages: Message[]`, `currentUserId: string`, `onSend: (content) => void`. Chat bubble layout. Auto-scrolls to bottom. Shows timestamp, read receipt. Text input at bottom
- **Dependencies**: None
- **Acceptance Criteria**: Messages display as chat bubbles. Own messages right-aligned. Auto-scrolls. Send button disabled on empty
- **Database changes**: None
- **API changes**: None
- **UI changes**: New MessageThread
- **Testing requirements**: Test message alignment, empty thread, send flow
- **Documentation updates**: Add to component catalog

#### Task 3.3.3.6: Build NotificationItem component
- **Description**: Create notification row. Props: `notification: Notification`, `onClick: () => void`, `onMarkRead: () => void`. Shows icon by type, message, timestamp, unread indicator
- **Dependencies**: None
- **Acceptance Criteria**: Unread: bold + blue dot. Read: normal weight. Click fires onClick. Mark read button
- **Database changes**: None
- **API changes**: None
- **UI changes**: New NotificationItem
- **Testing requirements**: Test read/unread states, different types
- **Documentation updates**: Add to component catalog

#### Task 3.3.3.7: Build FeedPost component
- **Description**: Create feed post card. Props: `post: FeedPost`, `onLike`, `onComment`, `onRepost`, `currentUserId`. Shows author, content, timestamp, engagement counts, action buttons
- **Dependencies**: None
- **Acceptance Criteria**: Renders post fully. Like/comment/repost buttons work. Already-liked state visually distinct
- **Database changes**: None
- **API changes**: None
- **UI changes**: New FeedPost
- **Testing requirements**: Test all engagement actions, truncation
- **Documentation updates**: Add to component catalog

## Feature 3.4: Error Boundaries

### User Story 3.4.1
As a user, I want graceful error handling on every page.

#### Task 3.4.4.1: Add error boundaries to all route groups
- **Description**: Create `error.tsx` files for: `/feed`, `/network`, `/messages`, `/opportunities`, `/news`, `/organizations`, `/resources`, `/search`, `/profile`, `/companies`, `/community`. Each uses ErrorState component. Logs error to Sentry
- **Dependencies**: 3.2.2.6
- **Acceptance Criteria**: Each route group has error.tsx. Unhandled errors show ErrorState with retry option. Error logged to Sentry
- **Database changes**: None
- **API changes**: None
- **UI changes**: 11 new error.tsx files
- **Testing requirements**: Simulate error in each route group, verify boundary catches it
- **Documentation updates**: List error boundaries in project-bible/03-ui/

## Master Execution Checklist — Epic 03

- [ ] 3.1.1.1 Sidebar component
- [ ] 3.1.1.2 Breadcrumb component
- [ ] 3.2.2.1 Tabs component
- [ ] 3.2.2.2 Tooltip component
- [ ] 3.2.2.3 Dropdown component
- [ ] 3.2.2.4 Pagination component
- [ ] 3.2.2.5 EmptyState component
- [ ] 3.2.2.6 ErrorState component
- [ ] 3.3.3.1 OpportunityFilters component
- [ ] 3.3.3.2 AdminTable component
- [ ] 3.3.3.3 ScrapeHealthCard component
- [ ] 3.3.3.4 ConnectionCard component
- [ ] 3.3.3.5 MessageThread component
- [ ] 3.3.3.6 NotificationItem component
- [ ] 3.3.3.7 FeedPost component
- [ ] 3.4.4.1 Error boundaries for all route groups
