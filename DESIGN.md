# Nocturne Design System

An original, dark, content-first design system for media-style apps. It uses only open-licensed fonts and its own colors and marks, so it is safe to ship.

## 1. Visual Theme & Atmosphere

The interface is a dark, immersive player that wraps people in a near-black cocoon (`#121212`, `#171717`, `#222222`) where cover art and content become the primary source of color. The design philosophy is "content-first darkness": the UI recedes into shadow so that music, podcasts, videos and playlists can glow. Every surface is a shade of charcoal, creating a theater-like environment where the only true color comes from one accent (Signal Indigo, `#6366f1`) and the imagery itself.

The typography uses Plus Jakarta Sans Variable (SIL Open Font License, bundled with the app) for both titles and interface text, with a system and Noto fallback stack that covers Arabic, Hebrew, Cyrillic, Greek, Devanagari and CJK. The type system is compact and functional: 700 (bold) for emphasis and navigation, 600 (semibold) for secondary emphasis, and 400 (regular) for body. Buttons use uppercase with positive letter-spacing (1.4px to 2px) for a systematic, label-like quality.

What distinguishes the system is its pill-and-circle geometry. Primary buttons use 500px to 9999px radius (full pill), circular play buttons use 50% radius, and search inputs are 500px pills. Combined with heavy shadows (`rgba(0,0,0,0.5) 0px 8px 24px`) on elevated elements and an inset border-shadow combo (`rgb(18,18,18) 0px 1px 0px, rgb(115,115,115) 0px 0px 0px 1px inset`), the result is an interface that feels like a premium audio device: tactile, rounded, and built for touch.

**Key Characteristics:**
- Near-black immersive dark theme (`#121212` to `#222222`): the UI disappears behind content
- Signal Indigo (`#6366f1`) as the single brand accent: never decorative, always functional
- Plus Jakarta Sans Variable with global script fallbacks
- Pill buttons (500px to 9999px) and circular controls (50%): rounded, touch-optimized
- Uppercase button labels with wide letter-spacing (1.4px to 2px)
- Heavy shadows on elevated elements (`rgba(0,0,0,0.5) 0px 8px 24px`)
- Semantic colors: negative rose (`#fb7185`), warning amber (`#fbbf24`), announcement sky (`#38bdf8`)
- Cover art is the primary color source: the UI is achromatic by design

## 2. Color Palette & Roles

### Primary Brand
- **Signal Indigo** (`#6366f1`): Primary brand accent for play buttons, active states, CTAs
- **Near Black** (`#121212`): Deepest background surface
- **Dark Surface** (`#171717`): Cards, containers, elevated surfaces
- **Mid Dark** (`#222222`): Button backgrounds, interactive surfaces

### Text
- **White** (`#ffffff`): `--text-base`, primary text
- **Silver** (`#a3a3a3`): Secondary text, muted labels, inactive nav
- **Near White** (`#d4d4d4`): Slightly brighter secondary text
- **Light** (`#fafafa`): Near-pure white for maximum emphasis

### Semantic
- **Negative Rose** (`#fb7185`): `--text-negative`, error states
- **Warning Amber** (`#fbbf24`): `--text-warning`, warning states
- **Announcement Sky** (`#38bdf8`): `--text-announcement`, info states

### Surface & Border
- **Dark Card** (`#262626`): Elevated card surface
- **Mid Card** (`#2a2a2a`): Alternate card surface
- **Border Gray** (`#404040`): Button borders on dark
- **Light Border** (`#737373`): Outlined button borders, muted links
- **Separator** (`#a3a3a3`): Divider lines
- **Light Surface** (`#e5e5e5`): Light-mode buttons (rare)
- **Accent Border** (`#4f46e5`): Accent border variant

### Shadows
- **Heavy** (`rgba(0,0,0,0.5) 0px 8px 24px`): Dialogs, menus, elevated panels
- **Medium** (`rgba(0,0,0,0.3) 0px 8px 8px`): Cards, dropdowns
- **Inset Border** (`rgb(18,18,18) 0px 1px 0px, rgb(115,115,115) 0px 0px 0px 1px inset`): Input border-shadow combo

## 3. Typography Rules

### Font Families
- **Title**: `Plus Jakarta Sans Variable`, fallbacks: `ui-sans-serif, system-ui, -apple-system, Segoe UI, Noto Sans, Noto Sans Arabic, Noto Sans Hebrew, Noto Sans Devanagari, Noto Sans JP, Helvetica Neue, Helvetica, Arial, sans-serif`
- **UI / Body**: `Plus Jakarta Sans Variable`, same fallback stack

Plus Jakarta Sans is licensed under the SIL Open Font License 1.1 and is installed as `@fontsource-variable/plus-jakarta-sans`, so it is self-hosted and free to use commercially.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Section Title | Title | 24px (1.50rem) | 700 | normal | normal | Bold title weight |
| Feature Heading | UI | 18px (1.13rem) | 600 | 1.30 (tight) | normal | Semibold section heads |
| Body Bold | UI | 16px (1.00rem) | 700 | normal | normal | Emphasized text |
| Body | UI | 16px (1.00rem) | 400 | normal | normal | Standard body |
| Button Uppercase | UI | 14px (0.88rem) | 600-700 | 1.00 (tight) | 1.4px-2px | `text-transform: uppercase` |
| Button | UI | 14px (0.88rem) | 700 | normal | 0.14px | Standard button |
| Nav Link Bold | UI | 14px (0.88rem) | 700 | normal | normal | Navigation |
| Nav Link | UI | 14px (0.88rem) | 400 | normal | normal | Inactive nav |
| Caption Bold | UI | 14px (0.88rem) | 700 | 1.50-1.54 | normal | Bold metadata |
| Caption | UI | 14px (0.88rem) | 400 | normal | normal | Metadata |
| Small Bold | UI | 12px (0.75rem) | 700 | 1.50 | normal | Tags, counts |
| Small | UI | 12px (0.75rem) | 400 | normal | normal | Fine print |
| Badge | UI | 10.5px (0.66rem) | 600 | 1.33 | normal | `text-transform: capitalize` |
| Micro | UI | 10px (0.63rem) | 400 | normal | normal | Smallest text |

### Principles
- **Bold/regular binary**: Most text is either 700 (bold) or 400 (regular), with 600 used sparingly. This creates a clear visual hierarchy through weight contrast rather than size variation.
- **Uppercase buttons as system**: Button labels use uppercase + wide letter-spacing (1.4px to 2px), creating a systematic "label" voice distinct from content text.
- **Compact sizing**: The range is 10px to 24px, narrower than most systems. The type is compact and functional, designed for scanning playlists, not reading articles.
- **Global script support**: The extensive fallback stack (Arabic, Hebrew, Cyrillic, Greek, Devanagari, CJK) keeps the interface readable in every market.

## 4. Component Stylings

### Buttons

**Dark Pill**
- Background: `#222222`
- Text: `#ffffff` or `#a3a3a3`
- Padding: 8px 16px
- Radius: 9999px (full pill)
- Use: Navigation pills, secondary actions

**Dark Large Pill**
- Background: `#171717`
- Text: `#ffffff`
- Padding: 0px 43px
- Radius: 500px
- Use: Primary app navigation buttons

**Light Pill**
- Background: `#e5e5e5`
- Text: `#171717`
- Radius: 500px
- Use: Light-mode CTAs (cookie consent, marketing)

**Outlined Pill**
- Background: transparent
- Text: `#ffffff`
- Border: `1px solid #737373`
- Padding: 4px 16px 4px 36px (asymmetric for icon)
- Radius: 9999px
- Use: Follow buttons, secondary actions

**Circular Play**
- Background: `#222222`
- Text: `#ffffff`
- Padding: 12px
- Radius: 50% (circle)
- Use: Play/pause controls

### Cards & Containers
- Background: `#171717` or `#222222`
- Radius: 6px-8px
- No visible borders on most cards
- Hover: slight background lightening
- Shadow: `rgba(0,0,0,0.3) 0px 8px 8px` on elevated

### Inputs
- Search input: `#222222` background, `#ffffff` text
- Radius: 500px (pill)
- Padding: 12px 96px 12px 48px (icon-aware)
- Focus: border becomes `#000000`, outline `1px solid`

### Navigation
- Dark sidebar with 14px weight 700 for active, 400 for inactive
- `#a3a3a3` muted color for inactive items, `#ffffff` for active
- Circular icon buttons (50% radius)
- Product logo top-left, drawn in the accent color

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 1px, 2px, 3px, 4px, 5px, 6px, 8px, 10px, 12px, 14px, 15px, 16px, 20px

### Grid & Container
- Sidebar (fixed) + main content area
- Grid-based album/playlist cards
- Full-width now-playing bar at bottom
- Responsive content area fills remaining space

### Whitespace Philosophy
- **Dark compression**: Content is packed densely: playlist grids, track lists and navigation are all tightly spaced. The dark background provides visual rest between elements without needing large gaps.
- **Content density over breathing room**: This is an app, not a marketing site. Every pixel serves the listening experience.

### Border Radius Scale
- Minimal (2px): Badges, explicit tags
- Subtle (4px): Inputs, small elements
- Standard (6px): Cover-art containers, cards
- Comfortable (8px): Sections, dialogs
- Medium (10px-20px): Panels, overlay elements
- Large (100px): Large pill buttons
- Pill (500px): Primary buttons, search input
- Full Pill (9999px): Navigation pills, search
- Circle (50%): Play buttons, avatars, icons

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Base (Level 0) | `#121212` background | Deepest layer, page background |
| Surface (Level 1) | `#171717` or `#222222` | Cards, sidebar, containers |
| Elevated (Level 2) | `rgba(0,0,0,0.3) 0px 8px 8px` | Dropdown menus, hover cards |
| Dialog (Level 3) | `rgba(0,0,0,0.5) 0px 8px 24px` | Modals, overlays, menus |
| Inset (Border) | `rgb(18,18,18) 0px 1px 0px, rgb(115,115,115) 0px 0px 0px 1px inset` | Input borders |

**Shadow Philosophy**: Heavy shadows for a dark-themed app. The 0.5 opacity shadow at 24px blur creates a dramatic "floating in darkness" effect for dialogs and menus, while the 0.3 opacity at 8px blur provides a more subtle card lift. The inset border-shadow combination on inputs creates a recessed, tactile quality.

## 7. Do's and Don'ts

### Do
- Use near-black backgrounds (`#121212` to `#222222`): depth through shade variation
- Apply Signal Indigo (`#6366f1`) only for play controls, active states, and primary CTAs
- Use pill shape (500px-9999px) for all buttons, and circular (50%) for play controls
- Apply uppercase + wide letter-spacing (1.4px-2px) on button labels
- Keep typography compact (10px-24px range): this is an app, not a magazine
- Use heavy shadows (0.3-0.5 opacity) for elevated elements on dark backgrounds
- Let cover art provide color: the UI itself is achromatic

### Don't
- Don't use the accent decoratively or on large backgrounds: it is functional only
- Don't use light backgrounds for primary surfaces: the dark immersion is core
- Don't skip the pill/circle geometry on buttons: square buttons break the identity
- Don't use thin/subtle shadows: on dark backgrounds, shadows need to be heavy to be visible
- Don't add additional brand colors: one accent + achromatic grays is the complete palette
- Don't use relaxed line-heights: the typography is compact and dense
- Don't expose raw gray borders: use shadow-based or inset borders instead

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile Small | <425px | Compact mobile layout |
| Mobile | 425-576px | Standard mobile |
| Tablet | 576-768px | 2-column grid |
| Tablet Large | 768-896px | Expanded layout |
| Desktop Small | 896-1024px | Sidebar visible |
| Desktop | 1024-1280px | Full desktop layout |
| Large Desktop | >1280px | Expanded grid |

### Collapsing Strategy
- Sidebar: full → collapsed → hidden
- Album grid: 5 columns → 3 → 2 → 1
- Now-playing bar: maintained at all sizes
- Search: pill input maintained, width adjusts
- Navigation: sidebar → bottom bar on mobile

## 9. Agent Prompt Guide

### Quick Color Reference
- Background: Near Black (`#121212`)
- Surface: Dark Surface (`#171717`)
- Text: White (`#ffffff`)
- Secondary text: Silver (`#a3a3a3`)
- Accent: Signal Indigo (`#6366f1`)
- Border: `#404040`
- Error: Negative Rose (`#fb7185`)

### Example Component Prompts
- "Create a dark card: #171717 background, 8px radius. Title at 16px Plus Jakarta Sans weight 700, white text. Subtitle at 14px weight 400, #a3a3a3. Shadow rgba(0,0,0,0.3) 0px 8px 8px on hover."
- "Design a pill button: #222222 background, white text, 9999px radius, 8px 16px padding. 14px Plus Jakarta Sans weight 700, uppercase, letter-spacing 1.4px."
- "Build a circular play button: Signal Indigo (#6366f1) background, #ffffff icon, 50% radius, 12px padding."
- "Create search input: #222222 background, white text, 500px radius, 12px 48px padding. Inset border: rgb(115,115,115) 0px 0px 0px 1px inset."
- "Design navigation sidebar: #121212 background. Active items: 14px weight 700, white. Inactive: 14px weight 400, #a3a3a3."

### Iteration Guide
1. Start with #121212: everything lives in near-black darkness
2. Signal Indigo for functional highlights only (play, active, CTA)
3. Pill everything: 500px for large, 9999px for small, 50% for circular
4. Uppercase + wide tracking on buttons: the systematic label voice
5. Heavy shadows (0.3-0.5 opacity) for elevation: light shadows are invisible on dark
6. Cover art provides all the color: the UI stays achromatic
