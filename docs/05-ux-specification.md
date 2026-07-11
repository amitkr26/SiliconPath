# 05 — UX Specification

## Global
- **Mobile-first.** Breakpoints: base, sm 640, md 768, lg 1024, xl 1280. Redesign per
  breakpoint, don't just shrink.
- **Nav:** top bar with logo, primary links (Opportunities, Academy, News, Organizations,
  Resources), auth actions. Authenticated adds Feed/Network/Messages/Notifications.
- **Touch targets** >= 44px on coarse pointers. Focus-visible rings everywhere.
- **Motion:** ease-out (quart/quint/expo), 100/300/500ms tiers; respect prefers-reduced-motion.

## Required states (every data view)
1. Loading (skeleton preferred over spinner; if spinner, must have timeout).
2. Error (message + retry, never raw error text to users).
3. Empty (actionable guidance).
4. Populated.

## Page specifics
- **Opportunities list:** filters left on desktop (sticky), collapsible top button on mobile.
  Rows not cards. Show deadline urgency. Pagination visible.
- **Opportunity detail:** primary CTA = Apply (external). Secondary = Save/Share.
- **Academy:** track cards with progress bar, lock state, prerequisite hint. Assessment CTA
  only when all days complete.
- **Feed/Network/Messages:** LinkedIn-style but lean. Empty feed guides to find people.
- **Resume builder:** stepper (5 steps), save on last step must not error on empty fields.

## Accessibility
- Semantic HTML, labelled inputs, alt text, color-contrast AA, keyboard nav, `text-wrap: balance`
  on headings, `pretty` on prose.
