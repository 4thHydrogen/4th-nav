# 4th-nav Homepage UI Redesign Spec

## Goal

Refactor the public homepage UI of `4th-nav` so it visually references `demo.mtab.cc` while preserving the current 4th-nav product model, interactions, and data structure.

This is a visual and structural redesign, not a product expansion. The result should feel closer to a browser start page / desktop launch surface instead of a plain categorized link list.

## Scope

In scope:

- Public homepage layout in `ui/src/pages/Home.tsx` and `ui/src/components/Content/*`
- Visual restyling of the homepage shell and homepage-specific components
- Better composition of existing desktop-oriented components:
  - `LeftCategoryNav`
  - `TimeDateWidget`
  - `DesktopCategorySection`
  - `ToolItem`
  - `ToolContextMenu`
- Responsive behavior for desktop, tablet, and mobile
- Preservation of existing homepage behaviors:
  - search
  - grouped categories
  - scroll-based category syncing
  - right-click view mode switching
  - dark mode
  - background image mode
  - glassmorphism mode

Out of scope:

- Adding weather, notes, widgets, plugin systems, or any mTab-specific feature set
- Changing backend APIs or homepage business semantics
- Redesigning admin pages
- Replacing the current search or category data model

## Product Direction

The redesign will follow a "desktop workspace" direction.

The page should present information in this visual order:

1. Time and date establish the page identity
2. Search becomes the primary interaction entry point
3. Left-side category navigation acts as spatial orientation
4. Main content area presents grouped tools as a clean desktop grid

This direction keeps 4th-nav recognizable while moving its visual language closer to mTab.

## Layout Design

### Desktop

Desktop uses a two-zone structure:

- A centered top header zone for time/date and search
- A content zone with a fixed left category rail and a scrollable main grid area

Expected behavior:

- The left category rail remains visually stable while the user scrolls content
- The active category remains highlighted based on scroll position
- Each category section has a clear heading and a consistent internal grid
- Search mode collapses the grouped structure into a flat result grid

### Tablet

Tablet keeps the desktop mental model but compresses spacing:

- Smaller top offset and narrower content width
- Left category rail may remain if space allows
- Tool spacing tightens without becoming cramped

### Mobile

Mobile prioritizes usability over desktop fidelity:

- Time/date remains visible but scales down
- Search remains prominent
- Left category rail is hidden
- Category sections become a single-column or compact multi-column flow depending on width

The mobile version should feel like a clean continuation of the desktop design, not a broken desktop layout.

## Visual System

### Tone

The visual tone should be calm, modern, and desktop-like.

Desired traits:

- soft spacing
- low-noise surfaces
- subtle translucency
- restrained shadow depth
- icon-first hierarchy
- less "admin panel" feeling

### Background and Surfaces

The page should work in three visual contexts:

- normal light mode
- dark mode
- background/glassmorphism mode

Surface styling should adapt consistently across these contexts rather than introducing one-off overrides per component.

### Shape and Spacing

The redesign should standardize:

- larger, more intentional radii
- more consistent vertical rhythm
- clearer separation between major page zones
- tighter micro-spacing inside tool items

### Typography

Typography should emphasize hierarchy:

- time is the most prominent text
- search is the primary interactive focus
- category titles are secondary anchors
- tool labels are compact and readable
- metadata is visibly de-emphasized

## Component Responsibilities

### `Content`

`Content` remains the homepage orchestrator and should:

- compose the top-level layout
- switch between grouped mode and search mode
- manage context menu state
- keep data loading and existing behavior wiring intact

It should not keep accumulating presentation-specific complexity that belongs in leaf components.

### `TimeDateWidget`

`TimeDateWidget` should become a stronger hero element:

- larger time display
- quieter supporting date line
- alignment and spacing tuned for homepage identity rather than utility-only display

### `LeftCategoryNav`

`LeftCategoryNav` should behave more like a desktop side rail than a floating tag list:

- cleaner vertical rhythm
- calmer active state
- better width consistency
- stronger visual integration with the page shell

### `DesktopCategorySection`

Each section should read as a deliberate content block:

- clear heading
- consistent spacing above and below
- grid that adapts to mixed tool item view modes

### `ToolItem`

`ToolItem` is the main visual unit and must carry most of the mTab-inspired feel.

For `icon` mode:

- compact
- icon-led
- label-first
- desktop-launcher feeling

For `card` mode:

- still aligned to the new homepage visual system
- cleaner metadata presentation
- less like a generic content card

Both modes must look like members of one system.

## Interaction Rules

The redesign must preserve these behaviors exactly or with equivalent outcomes:

- Search filters tools immediately
- Search mode uses a flat result presentation
- Category navigation scrolls to the correct section
- Active category updates from scroll position
- Right-click opens the tool context menu
- View mode changes update the correct tool and remain persisted through existing APIs
- Clicking `toggleJumpTarget` continues to work

No new interaction model should undermine keyboard navigation or current tool opening behavior.

## Responsive Rules

The redesign should use responsive simplification instead of visual shrinking.

Rules:

- hide the left rail when it no longer helps orientation
- reduce decorative layering on narrow screens
- preserve search usability and tool tap targets
- avoid dense grids that hurt readability on mobile

## Implementation Strategy

The implementation should prefer refactoring the homepage shell and component CSS before introducing new logic.

Recommended sequence:

1. Refine homepage shell layout in `Content`
2. Rework shared homepage CSS tokens and spacing
3. Restyle `TimeDateWidget`, `LeftCategoryNav`, `DesktopCategorySection`, and `ToolItem`
4. Verify grouped mode and search mode separately
5. Verify light, dark, and background/glassmorphism combinations

## Risks

Primary risks:

- New homepage styles colliding with older component CSS
- Search mode looking disconnected from grouped mode
- Mixed `icon` and `card` view modes causing inconsistent grid rhythm
- Background mode reducing text contrast
- Existing in-progress workspace changes overlapping homepage files

Mitigations:

- Keep homepage styling localized to homepage components
- Use one coherent spacing and surface system for both grouped and search layouts
- Test both view modes within the same category section
- Check contrast in all three appearance contexts
- Avoid touching unrelated admin or backend files

## Acceptance Criteria

The redesign is complete when:

- The homepage visually feels closer to `demo.mtab.cc` than the current 4th-nav UI
- Existing homepage functionality continues to work
- The page reads as a desktop-style navigation start page
- Search mode and grouped mode both feel intentional
- The result is usable in desktop, tablet, and mobile layouts
- Dark mode and background/glassmorphism mode remain coherent

## Non-Goals

This redesign does not attempt to make 4th-nav a clone of mTab.

The intended outcome is:

- mTab-inspired visual language
- preserved 4th-nav architecture
- improved polish without product sprawl
