# UI Migration Matrix

## Foundation
- `app/globals.css`: theme tokens, dark-mode surfaces, typography rhythm, focus styles, modern utility classes.
- `tailwind.config.ts`: consistent radii, container, shadows, motion, and brand colors.
- `components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `ModalShell.tsx`: unified shadcn-style primitives.

## App Shell and Navigation
- `components/layout/DashboardChrome.tsx`: modern shell spacing and content container.
- `components/layout/Header.tsx`: modern top bar, improved quick actions and state affordances.
- `components/nav/Sidebar.tsx`: refreshed hierarchy, active states, collapsed handling.
- `components/nav/Breadcrumbs.tsx`: improved readability and hierarchy.
- `components/layout/Footer.tsx`: subtle modern footer treatment.

## Section Layouts
- `app/dashboard/clients/layout.tsx`
- `app/dashboard/bookings/layout.tsx`
- `app/dashboard/dispatching/layout.tsx`
- `app/dashboard/payments/layout.tsx`
- `app/dashboard/admin/layout.tsx`
- `app/dashboard/super-admin/layout.tsx`

All section layouts use one standardized heading pattern and badge treatment.

## Sub-Navigation
- `components/nav/DispatchingSubnav.tsx`
- `components/nav/PaymentsSubnav.tsx`

Both are aligned to the same modern tab interaction pattern.

## Core Pages
- `app/page.tsx` + `components/auth/LoginCard.tsx`: redesigned entry experience.
- `app/dashboard/page.tsx`: modernized cards, spacing, and content hierarchy.

## CRUD-heavy Modules (propagated via shared primitives)
- `components/admin/*Manager.tsx` and related form/table children now inherit updated button/input/card/modal and tokenized color system without business logic changes.

## Validation Targets
- Light and dark mode parity.
- Keyboard focus visibility.
- Responsive shell behavior for mobile/desktop navigation.
- Consistent component states (hover/active/disabled/error).
