# UI Component Catalog

## Component Inventory

BerojgarDegreeWala uses ~90 components organized by domain:

### Layout Components
```
RootLayout (app/layout.tsx)          — Providers, headers, toasters
Header (components/Header.tsx)       — Nav, search, auth status
Footer (components/Footer.tsx)       — Links, social, newsletter
Sidebar                           — Mobile filter sidebar
```

### Core UI Components
```
Button             — Primary, secondary, ghost, danger, icon-only
Badge              — Category, status, date badges
Card               — Surface card with hover effects
Input              — Text, search, select, multi-select
Modal              — Dialog overlay
Toast (Sonner)     — Success, error, info notifications
Skeleton           — Loading placeholder
Spinner            — Loading spinner with timeout
Pagination         — Page navigation
Tabs               — Tab navigation
Breadcrumb         — Breadcrumb navigation
Avatar             — User avatar
Tooltip            — Hover tooltip
Dropdown           — Dropdown menu
EmptyState         — No data illustration
ErrorState         — Error message with retry
Table              — Data table (opportunities list)
```

### Domain Components
```
OpportunityRow     — List row for opportunity (primary listing format)
OpportunityCard    — Card version (featured/spotlight)
OpportunityFilters — Filter panel (type, category, location, date)
SearchBar         — Search input with autocomplete
AcademyTrackCard  — Track card with progress bar
AcademyDayCard    — Day card with completion status
AssessmentCard    — Assessment entry card
AssessmentQuestion — MCQ question component
NewsCard          — News article card
OrganizationCard  — Organization card with logo
ResourceCard      — Resource link card
ConnectionCard    — Connection/user card
MessageThread     — Message thread display
NotificationItem  — Notification row
FeedPost          — Feed post with engagement
ResumeBuilder     — Resume editor
AdminTable        — Admin data table with actions
ScrapeHealthCard  — Scraper status card
```

## Page Blueprints

### Landing Page (`/`)
- Hero section with search
- Feature spotlight cards (3)
- Featured opportunities (5)
- Stats bar (4 metrics)
- Academy callout
- Newsletter signup

### Opportunities List (`/opportunities`)
- Search bar (top)
- Filter sidebar (left, collapsible on mobile)
- Results area: row-based list with pagination
- Empty state when no results
- Loading skeleton on page load

### Opportunity Detail (`/opportunities/[slug]`)
- Hero: title, organization, category, tags
- Details: stipend, location, deadline, type
- Apply button (links to source_url)
- Related opportunities
- JSON-LD structured data

### Academy (`/academy`)
- Track list with progress bars
- Each track shows: name, description, day count, completion %
- "Continue" / "Start" button per track
- Overall progress header

### Academy Track (`/academy/[trackId]`)
- Day-by-day content list
- Day cards: title, summary, duration, status (locked/available/completed)
- Assessment card at end (gated)
- Progress indicator

### Academy Assessment (`/academy/[trackId]/assessment`)
- Track name + "Take Assessment" header
- 15-20 MCQ questions (1 per page)
- Timer (if applicable)
- Submit → score display

### News (`/news`)
- Article cards in grid/list
- Category filter
- Search

### Feed (`/feed`) [Auth Required]
- Post creation box
- Post cards with engagement
- Infinite scroll

### Network (`/network`) [Auth Required]
- Connections list
- Pending requests
- Recommended connections
- Search people

### Messages (`/messages`) [Auth Required]
- Conversation list (sidebar)
- Message thread (main area)
- New message button

### Admin Dashboard (`/admin`) [Admin Required]
- Stats overview
- Scraper health
- Recent opportunities (verify/reject)
- Subscriber list
- AI usage

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, hamburger nav |
| Tablet | 640-1024px | 2 columns, collapsed sidebar |
| Desktop | > 1024px | Full layout, persistent sidebar |

## Related Documents

- [component-catalog.md](./component-catalog.md) — Detailed component API
- [page-blueprints.md](./page-blueprints.md) — Wireframes and layouts
- [responsive-breakpoints.md](./responsive-breakpoints.md) — Responsive design
