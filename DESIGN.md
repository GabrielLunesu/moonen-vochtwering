# Moonen Vochtwering Design System

## 1. Atmosphere & Identity

A practical service interface for customers and operators: calm, direct, and trustworthy. The signature is restrained contractor clarity: white cards, soft gray page backgrounds, and a deep Moonen green reserved for decisions and confirmations.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/page | `--background` | `#ffffff` | `oklch(0.145 0 0)` | App background |
| Surface/soft | `--color-muted` | `#f5f5f5` | `oklch(0.269 0 0)` | Public page and quiet panels |
| Surface/card | `--color-card` | `#ffffff` | `oklch(0.205 0 0)` | Cards, dialogs, popovers |
| Text/primary | `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Headings and body |
| Text/muted | `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Supporting copy and metadata |
| Border/default | `--color-border` | `#e5e5e5` | `oklch(1 0 0 / 10%)` | Card, input, and divider outlines |
| Action/primary | `--moonen-action` | `#355b23` | `#9bbc5c` | Quote acceptance, success icons, primary customer actions |
| Action/soft | `--moonen-action-soft` | `#f0f7ec` | `oklch(0.269 0 0)` | Accepted/proposed highlights |
| Status/error | `--color-destructive` | `#dc2626` | `oklch(0.704 0.191 22.216)` | Error and destructive states |

### Rules

- Use Moonen green only for customer decisions, confirmation, success, and brand emphasis.
- Use gray surfaces for quiet framing; do not introduce decorative gradients on operational screens.
- New colors must be named here before use.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Page title | `1.25rem` | 700 | 1.4 | 0 | Dashboard section titles |
| Card title | `1.125rem` | 700 | 1.4 | 0 | Public confirmation cards |
| Body | `1rem` | 400 | 1.6 | 0 | Paragraphs |
| Body/sm | `0.875rem` | 400 | 1.5 | 0 | Supporting text and form help |
| Caption | `0.75rem` | 500 | 1.4 | 0 | Labels and metadata |

### Font Stack

- Primary: `var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Serif: `"SF Pro Display", "SF Pro", -apple-system, BlinkMacSystemFont, var(--font-inter), sans-serif`
- Mono: system monospace only when code-like data is shown.

### Rules

- Customer-facing form copy uses body or body/sm; avoid hero-scale type inside cards.
- Body text never drops below `0.875rem`.

## 4. Spacing & Layout

### Base Unit

All spacing derives from a 4px base.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight icon and label gaps |
| `--space-2` | 8px | Inline groups and small vertical rhythm |
| `--space-3` | 12px | Compact form stacks |
| `--space-4` | 16px | Default card/form padding |
| `--space-6` | 24px | Comfortable card padding |
| `--space-8` | 32px | Section and CTA separation |

### Grid

- Public one-card flows use a centered single column with `max-w-md`.
- Dashboard pages use full-width bands with 24px inner padding.
- Breakpoints follow Tailwind defaults: `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`.

### Rules

- Fixed-format controls use stable dimensions from existing shadcn button and checkbox primitives.
- Text in customer action cards must wrap cleanly within `max-w-md`.

## 5. Components

### Card

- **Structure**: `Card` with optional `CardHeader`, `CardTitle`, and `CardContent`.
- **Variants**: default white surface with border.
- **Spacing**: `p-6` for customer cards, `space-y-4` for form content.
- **States**: static container; state is shown through child icon/copy.
- **Accessibility**: keep headings as visible titles; avoid nested card containers.
- **Motion**: none on public confirmation flows.

### Button

- **Structure**: shared shadcn `Button`.
- **Variants**: default, outline, ghost.
- **Spacing**: full-width buttons in customer flows, default height from the primitive.
- **States**: default, hover, focus-visible ring, disabled opacity, loading with `Loader2`.
- **Accessibility**: button text must describe the action; disable only when action requirements are unmet.
- **Motion**: transition from the primitive only.

### Checkbox With Label

- **Structure**: shared `Checkbox` paired with `Label`.
- **Variants**: default checkbox with descriptive inline text and links.
- **Spacing**: `gap-3`, aligned to the first text line.
- **States**: unchecked, checked, focus-visible, disabled.
- **Accessibility**: label is bound through `id`/`htmlFor`; linked terms remain keyboard reachable.
- **Motion**: none beyond primitive focus/checked feedback.

### Textarea

- **Structure**: shared `Textarea`.
- **Variants**: default bordered field.
- **Spacing**: four rows for customer questions.
- **States**: default, focus, disabled.
- **Accessibility**: placeholder clarifies expected input; send button remains disabled until text exists.
- **Motion**: none.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100-150ms | ease-out | Button and focus feedback |
| Standard | 200-300ms | ease-in-out | Existing marketing component transitions |

### Rules

- Public forms do not add decorative motion.
- Loading states use the existing `Loader2` spinner only while network submission is active.
- Respect focus-visible rings from the shared primitives.

## 7. Depth & Surface

### Strategy

Mixed, with borders as the default and soft shadows only from existing primitives.

| Level | Value | Usage |
|-------|-------|-------|
| Border/default | `1px solid var(--color-border)` | Cards, inputs, checkboxes |
| Radius/card | `var(--radius-lg)` | Cards and popovers |
| Radius/control | `var(--radius-md)` | Buttons and inputs |

Public customer flows use a gray page background and one white card. Do not place cards inside cards.
