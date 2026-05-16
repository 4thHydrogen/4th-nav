# 4th-nav Homepage MTab UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the public homepage into an mTab-inspired desktop workspace layout while preserving current 4th-nav homepage behavior.

**Architecture:** Keep homepage data flow and interaction logic in `Content`, then move the redesign through focused presentational updates in `Content`, `TimeDateWidget`, `LeftCategoryNav`, `DesktopCategorySection`, and `ToolItem`. Guard the main grouped-vs-search rendering rules with tests before changing layout and styles.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, CSS modules-by-folder convention using component `index.css`

---

## File Map

### Modify

- `D:\Project\4th-nav\ui\src\__tests__\content.test.ts`
  - Extend homepage rendering coverage for grouped mode, search mode, and desktop shell composition.
- `D:\Project\4th-nav\ui\src\components\Content\index.tsx`
  - Keep orchestration logic intact while restructuring the homepage shell markup.
- `D:\Project\4th-nav\ui\src\components\Content\index.css`
  - Replace the current mixed legacy/desktop homepage styles with a clearer shell and responsive system.
- `D:\Project\4th-nav\ui\src\components\TimeDateWidget\index.css`
  - Promote time/date into a more intentional hero block.
- `D:\Project\4th-nav\ui\src\components\LeftCategoryNav\index.css`
  - Shift the category rail from floating chip list to desktop side rail styling.
- `D:\Project\4th-nav\ui\src\components\DesktopCategorySection\index.css`
  - Create clearer category blocks and a steadier grid rhythm for mixed icon/card items.
- `D:\Project\4th-nav\ui\src\components\ToolItem\index.css`
  - Make icon mode feel like a launcher tile and card mode feel like part of the same surface system.

### Verify While Reading

- `D:\Project\4th-nav\ui\src\components\TimeDateWidget\index.tsx`
- `D:\Project\4th-nav\ui\src\components\LeftCategoryNav\index.tsx`
- `D:\Project\4th-nav\ui\src\components\DesktopCategorySection\index.tsx`
- `D:\Project\4th-nav\ui\src\components\ToolItem\index.tsx`

---

### Task 1: Lock Homepage Behavior With Tests

**Files:**

- Modify: `D:\Project\4th-nav\ui\src\__tests__\content.test.ts`
- Verify against: `D:\Project\4th-nav\ui\src\components\Content\index.tsx`

- [ ] **Step 1: Write a failing homepage layout test for grouped mode**

Add assertions that grouped mode renders the desktop shell elements and category sections together.

```tsx
it("renders the desktop workspace shell in grouped mode", async () => {
  mockUseContentData({
    loading: false,
    data: buildData(),
  });
  mockUseSearch({
    val: "",
    searchString: "",
    filteredData: [],
    groupedData: {
      Common: [buildTool({ id: 1, name: "Docs" })],
      Dev: [buildTool({ id: 2, name: "Console" })],
    },
  });
  mockCategoryObserver({
    visibleCategory: "Common",
    scrollToCategory: vi.fn(),
  });

  render(<Content />);

  expect(screen.getByRole("main")).toHaveClass("desktop-page");
  expect(screen.getByText("Common")).toBeInTheDocument();
  expect(screen.getByText("Dev")).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/搜索/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the targeted test to verify RED**

Run: `npm test -- src/__tests__/content.test.ts`

Expected: the new test fails because the exact shell classes and/or grouped layout assertions do not yet match the redesigned structure.

- [ ] **Step 3: Write a failing search-mode test**

Add a second test that proves search mode hides the grouped sections and shows a flat results grid.

```tsx
it("renders a flat result grid while searching", async () => {
  mockUseContentData({
    loading: false,
    data: buildData(),
  });
  mockUseSearch({
    val: "git",
    searchString: "git",
    filteredData: [buildTool({ id: 9, name: "GitHub" })],
    groupedData: {
      Common: [buildTool({ id: 1, name: "Docs" })],
    },
  });

  render(<Content />);

  expect(screen.queryByText("Common")).not.toBeInTheDocument();
  expect(document.querySelector(".desktop-tool-grid-flat")).not.toBeNull();
  expect(screen.getByText("GitHub")).toBeInTheDocument();
});
```

- [ ] **Step 4: Re-run the targeted test file and confirm RED**

Run: `npm test -- src/__tests__/content.test.ts`

Expected: at least one new assertion fails for the intended behavior rather than a test setup error.

- [ ] **Step 5: Commit the red test baseline after implementation is complete**

Run later with: `git add ui/src/__tests__/content.test.ts`

Commit message: `test: lock homepage desktop shell behavior`

---

### Task 2: Reshape The Homepage Shell

**Files:**

- Modify: `D:\Project\4th-nav\ui\src\components\Content\index.tsx`
- Modify: `D:\Project\4th-nav\ui\src\components\Content\index.css`
- Verify with: `D:\Project\4th-nav\ui\src\__tests__\content.test.ts`

- [ ] **Step 1: Update `Content` markup to use a clearer hero/shell/content split**

Refactor the main structure so the header reads as a hero area and the grid lives in an explicit workspace body.

```tsx
<main className="desktop-page">
  <section className="desktop-hero">
    <div className="desktop-hero-inner">
      <TimeDateWidget />
      <div className="desktop-search-shell">
        <SearchBar
          searchString={val}
          setSearchText={(t) => {
            setVal(t);
            handleSetSearch(t);
          }}
        />
      </div>
    </div>
  </section>

  <section className="desktop-workspace">
    {isGroupedMode && !isSearching && (
      <LeftCategoryNav
        categories={Object.keys(groupedData)}
        activeCategory={visibleCategory}
        onNavigate={scrollToCategory}
      />
    )}

    <div className="desktop-content-shell">
      {/* grouped sections or flat search grid */}
    </div>
  </section>
</main>
```

- [ ] **Step 2: Replace shell layout CSS with a focused desktop workspace system**

Create one coherent block for the homepage shell and remove the need to depend on older `.content` grid rules for the new layout.

```css
.desktop-page {
  min-height: 100vh;
  padding: 40px 24px 32px;
}

.desktop-hero {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}

.desktop-hero-inner {
  width: min(100%, 760px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.desktop-workspace {
  width: min(1280px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 24px;
}

.desktop-content-shell {
  min-width: 0;
}
```

- [ ] **Step 3: Add explicit search-state and responsive rules**

Make grouped mode and search mode visually related while hiding the side rail on narrow screens.

```css
.desktop-tool-grid-flat {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 18px;
}

@media (max-width: 900px) {
  .desktop-workspace {
    grid-template-columns: 1fr;
  }

  .desktop-content-shell {
    width: 100%;
  }
}
```

- [ ] **Step 4: Run the targeted content test file to verify GREEN for shell behavior**

Run: `npm test -- src/__tests__/content.test.ts`

Expected: the grouped-mode and search-mode assertions pass after the shell structure is updated.

- [ ] **Step 5: Commit the shell refactor**

Run: `git add ui/src/components/Content/index.tsx ui/src/components/Content/index.css ui/src/__tests__/content.test.ts`

Commit message: `feat: reshape homepage desktop shell`

---

### Task 3: Restyle Hero And Navigation Components

**Files:**

- Modify: `D:\Project\4th-nav\ui\src\components\TimeDateWidget\index.css`
- Modify: `D:\Project\4th-nav\ui\src\components\LeftCategoryNav\index.css`

- [ ] **Step 1: Update time/date styling to feel like a homepage hero**

Adjust typography, spacing, and responsive scaling without changing the component logic.

```css
.time-date-widget {
  text-align: center;
  user-select: none;
  padding: 8px 0 4px;
}

.time-text {
  font-size: clamp(52px, 8vw, 86px);
  font-weight: 300;
  letter-spacing: 0.08em;
  line-height: 1;
}

.date-text {
  margin-top: 10px;
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Restyle the left category rail as a calmer desktop side rail**

Make the rail feel anchored to the workspace rather than floating independently.

```css
.left-category-nav {
  gap: 8px;
  padding: 12px 10px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.left-category-nav-item {
  min-width: 76px;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 12px;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 3: Verify grouped mode still exposes category labels and search remains usable**

Run: `npm test -- src/__tests__/content.test.ts`

Expected: tests stay green because the behavior contract is unchanged by CSS-only updates.

- [ ] **Step 4: Commit the hero/navigation styling pass**

Run: `git add ui/src/components/TimeDateWidget/index.css ui/src/components/LeftCategoryNav/index.css`

Commit message: `style: refine homepage hero and category rail`

---

### Task 4: Restyle Category Sections And Tool Tiles

**Files:**

- Modify: `D:\Project\4th-nav\ui\src\components\DesktopCategorySection\index.css`
- Modify: `D:\Project\4th-nav\ui\src\components\ToolItem\index.css`

- [ ] **Step 1: Update category section styling to create clearer content blocks**

Introduce steadier section spacing and a cleaner title treatment.

```css
.desktop-category-section {
  margin-bottom: 36px;
}

.desktop-category-title {
  margin: 0 0 18px;
  padding-left: 0;
  border-left: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.desktop-tool-grid {
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 18px;
}
```

- [ ] **Step 2: Rework icon-mode tiles into launcher-like desktop items**

Make icon mode visually dominant and closer to the mTab desktop feeling.

```css
.tool-item-icon {
  width: 100%;
  min-height: 118px;
  padding: 14px 10px 12px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
}

.tool-item-icon .tool-item-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 18px;
}

.tool-item-icon .tool-item-title {
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.4;
}
```

- [ ] **Step 3: Rework card-mode tiles so they belong to the same system**

Keep card mode richer, but visually aligned with icon mode surfaces.

```css
.tool-item-card {
  min-height: 92px;
  padding: 16px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
}

.tool-item-card .tool-item-category {
  border-radius: 999px;
  padding: 2px 8px;
}
```

- [ ] **Step 4: Run the homepage tests again**

Run: `npm test -- src/__tests__/content.test.ts`

Expected: tests stay green because rendering behavior remains stable while presentation changes.

- [ ] **Step 5: Build the UI bundle for regression detection**

Run: `npm run build`

Expected: Vite build and Workbox generation complete with exit code 0.

- [ ] **Step 6: Commit the component styling pass**

Run: `git add ui/src/components/DesktopCategorySection/index.css ui/src/components/ToolItem/index.css`

Commit message: `style: give homepage tools an mtab-inspired visual system`

---

### Task 5: Full Verification And Cleanup

**Files:**

- Verify: `D:\Project\4th-nav\ui\src\components\Content\index.tsx`
- Verify: `D:\Project\4th-nav\ui\src\components\Content\index.css`
- Verify: `D:\Project\4th-nav\ui\src\components\TimeDateWidget\index.css`
- Verify: `D:\Project\4th-nav\ui\src\components\LeftCategoryNav\index.css`
- Verify: `D:\Project\4th-nav\ui\src\components\DesktopCategorySection\index.css`
- Verify: `D:\Project\4th-nav\ui\src\components\ToolItem\index.css`

- [ ] **Step 1: Run the focused homepage test file one more time**

Run: `npm test -- src/__tests__/content.test.ts`

Expected: all tests in the file pass.

- [ ] **Step 2: Run the full frontend test suite**

Run: `npm test`

Expected: all Vitest tests pass with exit code 0.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: build completes successfully and catches no CSS/TS regressions.

- [ ] **Step 4: Review the diff for accidental scope creep**

Run: `git diff -- ui/src/components/Content/index.tsx ui/src/components/Content/index.css ui/src/components/TimeDateWidget/index.css ui/src/components/LeftCategoryNav/index.css ui/src/components/DesktopCategorySection/index.css ui/src/components/ToolItem/index.css ui/src/__tests__/content.test.ts`

Expected: only homepage UI and test changes relevant to this redesign are present.

- [ ] **Step 5: Final commit**

Run: `git add ui/src/__tests__/content.test.ts ui/src/components/Content/index.tsx ui/src/components/Content/index.css ui/src/components/TimeDateWidget/index.css ui/src/components/LeftCategoryNav/index.css ui/src/components/DesktopCategorySection/index.css ui/src/components/ToolItem/index.css`

Commit message: `feat: redesign homepage with mtab-inspired workspace ui`

---

## Self-Review

### Spec Coverage

- Desktop workspace structure is covered in Task 2.
- Time/date hero emphasis is covered in Task 3.
- Side rail refinement is covered in Task 3.
- Category blocks and tool presentation are covered in Task 4.
- Search-mode and grouped-mode preservation are covered in Task 1 and Task 2.
- Responsive behavior is covered in Task 2 and Task 4.
- Final verification for tests and build is covered in Task 5.

### Placeholder Scan

No `TODO`, `TBD`, or "implement later" placeholders remain in the task list. Commands, file paths, and change targets are explicit.

### Type Consistency

The plan does not introduce new component props or type names. It keeps the current `Content`, `TimeDateWidget`, `LeftCategoryNav`, `DesktopCategorySection`, and `ToolItem` interfaces intact.
