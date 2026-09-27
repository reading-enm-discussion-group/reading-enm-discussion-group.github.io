# Community Group Static Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a six-section, single-page static site for a community reading/discussion group, with sidebar navigation, scroll-spy highlighting, and a light/dark theme toggle, where all page content lives in individually-editable Markdown files that non-technical members can edit directly on github.com.

**Architecture:** A Jekyll site using a `sections` collection (`_sections/*.md`, one file per section, front matter driving title/order/anchor) that a shared layout (`_layouts/default.html`) loops over to render both the sidebar nav and the main content, so content and structure stay decoupled. GitHub Pages' built-in Jekyll build handles everything — no separate build step, bundler config, or JS framework.

**Tech Stack:** Jekyll via the `github-pages` gem (matches GitHub Pages' build environment exactly), vanilla CSS (custom properties for theming), vanilla JavaScript (no frameworks, no npm), Bash + grep for the build-verification test harness.

**Spec:** `docs/superpowers/specs/2026-09-27-community-page-design.md`

## Global Constraints

- Exactly six content sections, text only, no images.
- Section content must be editable as plain Markdown in GitHub's web UI, with no HTML/CSS/JS required from the editor.
- No local build tooling beyond GitHub Pages' built-in Jekyll processing — no GitHub Actions workflow, npm, or bundler beyond Ruby's Bundler (which mirrors GitHub Pages' own build).
- Typeface: system font stack only (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`); no web font downloads.
- Contrast: body text ≥ 7:1 (WCAG AAA) against its background; interactive elements ≥ 4.5:1 (WCAG AA).
- Theme defaults to the visitor's `prefers-color-scheme`; an explicit toggle choice overrides it and persists via `localStorage`.
- Responsive breakpoint at 768px — sidebar nav collapses to a hamburger toggle below it.
- No images or icons beyond the theme-toggle icon; single page only; no CMS or dynamic server-side content.

## Review Focus

- JavaScript fails to load or is disabled → all six sections' text and the correct default theme (via the CSS `prefers-color-scheme` query) must still render, since content is server-rendered by Jekyll, not fetched by script.
- A section's Markdown file ends up with a missing or duplicated `nav_id`/`order` in front matter → the build must not silently produce broken anchors or duplicate HTML ids.
- Keyboard-only use (Tab/Shift+Tab, Enter/Space, no mouse) → every interactive control (mobile toggle, nav links, theme toggle) must be reachable and operable with a visible focus indicator.
- A visitor has `prefers-reduced-motion: reduce` set → clicking a nav link must jump instantly instead of animating.
- A very short section sits next to long ones → the scroll-spy highlight must not skip past its nav link or flicker rapidly.

## File Structure

```
Gemfile                          # pins the github-pages gem
.gitignore                       # excludes _site/, bundler artifacts
_config.yml                      # declares the "sections" collection
_sections/
  01-welcome.md
  02-about-us.md
  03-meeting-schedule.md
  04-reading-list.md
  05-discussion-guidelines.md
  06-contact.md                  # placeholder content per section
_layouts/
  default.html                   # page shell: nav + main, loops sections
styles.css                       # layout, typography, theming
script.js                        # mobile nav toggle, scroll-spy, theme toggle
index.md                         # selects the default layout
test/
  check-site.sh                  # build + grep-based structural checks
README.md                        # gains a content-editing guide (Task 5)
```

---

### Task 1: Jekyll scaffold rendering six sections from Markdown files, in order

**Files:**
- Create: `Gemfile`
- Create: `.gitignore`
- Create: `_config.yml`
- Create: `index.md`
- Create: `_layouts/default.html`
- Create: `_sections/01-welcome.md`, `02-about-us.md`, `03-meeting-schedule.md`, `04-reading-list.md`, `05-discussion-guidelines.md`, `06-contact.md`
- Create: `test/check-site.sh`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a `sections` collection where each document has front matter `title` (string), `nav_id` (string, URL-safe slug, used as the section's HTML `id`), and `order` (integer 1–6, the single source of truth for sequence). `_layouts/default.html` defines `{% assign ordered_sections = site.sections | sort: "order" %}` and renders each as `<section id="{{ section.nav_id }}"><h2>{{ section.title }}</h2>{{ section.content }}</section>`. Later tasks extend this same layout and reuse `ordered_sections`.

- [ ] **Step 1: Create the Gemfile**

```ruby
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
```

- [ ] **Step 2: Create .gitignore**

```
_site/
.jekyll-cache/
.jekyll-metadata
.bundle/
vendor/
Gemfile.lock
```

- [ ] **Step 3: Create _config.yml**

```yaml
title: "Reading & ENM Discussion Group"
description: "A community space for reading and discussing ethical non-monogamy."

collections:
  sections:
    output: false
```

- [ ] **Step 4: Create index.md**

```markdown
---
layout: default
---
```

- [ ] **Step 5: Create a minimal _layouts/default.html (no section loop yet)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ site.title }}</title>
</head>
<body>
</body>
</html>
```

- [ ] **Step 6: Install gems**

Run: `bundle install`
Expected: completes without error, creates `Gemfile.lock` (gitignored).

- [ ] **Step 7: Create test/check-site.sh with the Task 1 assertions**

```bash
#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."

FAILURES=0

pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; FAILURES=$((FAILURES + 1)); }

assert_contains() {
  local file="$1" needle="$2" desc="$3"
  if grep -qF -- "$needle" "$file"; then pass "$desc"; else fail "$desc (expected '$needle' in $file)"; fi
}

assert_order() {
  local file="$1" first="$2" second="$3" desc="$4"
  local line1 line2
  line1=$(grep -nF -- "$first" "$file" | head -1 | cut -d: -f1)
  line2=$(grep -nF -- "$second" "$file" | head -1 | cut -d: -f1)
  if [ -n "${line1:-}" ] && [ -n "${line2:-}" ] && [ "$line1" -lt "$line2" ]; then
    pass "$desc"
  else
    fail "$desc (expected '$first' before '$second' in $file)"
  fi
}

assert_unique_section_ids() {
  local file="$1"
  local ids duplicates
  ids=$(grep -oE '<section id="[^"]*"' "$file" | sed -E 's/<section id="([^"]*)"/\1/')
  duplicates=$(echo "$ids" | sort | uniq -d)
  if [ -z "$duplicates" ]; then
    pass "all section ids are unique and non-empty"
  else
    fail "duplicate or empty section id(s) found: $duplicates"
  fi
}

echo "Building site..."
bundle exec jekyll build --quiet

# --- Task 1: sections render from _sections/*.md, in order, with unique ids ---
assert_contains _site/index.html '<section id="welcome">' "welcome section renders with correct id"
assert_contains _site/index.html '<h2>Welcome</h2>' "welcome section has correct heading"
assert_contains _site/index.html '<section id="about-us">' "about-us section renders with correct id"
assert_contains _site/index.html '<section id="meeting-schedule">' "meeting-schedule section renders with correct id"
assert_contains _site/index.html '<section id="reading-list">' "reading-list section renders with correct id"
assert_contains _site/index.html '<section id="discussion-guidelines">' "discussion-guidelines section renders with correct id"
assert_contains _site/index.html '<section id="contact">' "contact section renders with correct id"
assert_order _site/index.html 'id="welcome"' 'id="about-us"' "welcome renders before about-us"
assert_order _site/index.html 'id="about-us"' 'id="meeting-schedule"' "about-us renders before meeting-schedule"
assert_order _site/index.html 'id="meeting-schedule"' 'id="reading-list"' "meeting-schedule renders before reading-list"
assert_order _site/index.html 'id="reading-list"' 'id="discussion-guidelines"' "reading-list renders before discussion-guidelines"
assert_order _site/index.html 'id="discussion-guidelines"' 'id="contact"' "discussion-guidelines renders before contact"
assert_unique_section_ids _site/index.html

if [ "$FAILURES" -eq 0 ]; then
  echo "All checks passed."
  exit 0
else
  echo "$FAILURES check(s) failed."
  exit 1
fi
```

- [ ] **Step 8: Run the test script and confirm it fails**

Run: `bash test/check-site.sh`
Expected: the build succeeds but every `assert_contains`/`assert_order`/`assert_unique_section_ids` line reports `FAIL`, since no sections exist yet and `default.html` renders an empty body. Exit code 1.

- [ ] **Step 9: Create the six placeholder section files**

`_sections/01-welcome.md`:
```markdown
---
title: "Welcome"
nav_id: welcome
order: 1
---
This is placeholder text for the Welcome section. Replace this paragraph with the group's actual welcome message.
```

`_sections/02-about-us.md`:
```markdown
---
title: "About Us"
nav_id: about-us
order: 2
---
This is placeholder text for the About Us section. Replace this paragraph with information about the group.
```

`_sections/03-meeting-schedule.md`:
```markdown
---
title: "Meeting Schedule"
nav_id: meeting-schedule
order: 3
---
This is placeholder text for the Meeting Schedule section. Replace this paragraph with meeting times and locations.
```

`_sections/04-reading-list.md`:
```markdown
---
title: "Reading List"
nav_id: reading-list
order: 4
---
This is placeholder text for the Reading List section. Replace this paragraph with the current reading list.
```

`_sections/05-discussion-guidelines.md`:
```markdown
---
title: "Discussion Guidelines"
nav_id: discussion-guidelines
order: 5
---
This is placeholder text for the Discussion Guidelines section. Replace this paragraph with the group's discussion guidelines.
```

`_sections/06-contact.md`:
```markdown
---
title: "Contact"
nav_id: contact
order: 6
---
This is placeholder text for the Contact section. Replace this paragraph with how to get in touch or get involved.
```

- [ ] **Step 10: Update _layouts/default.html to render the sections**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ site.title }}</title>
</head>
<body>
  {% assign ordered_sections = site.sections | sort: "order" %}
  <main>
    {% for section in ordered_sections %}
    <section id="{{ section.nav_id }}">
      <h2>{{ section.title }}</h2>
      {{ section.content }}
    </section>
    {% endfor %}
  </main>
</body>
</html>
```

- [ ] **Step 11: Run the test script and confirm it passes**

Run: `bash test/check-site.sh`
Expected: every line reports `PASS`, ending with `All checks passed.` and exit code 0.

- [ ] **Step 12: Commit**

```bash
git add Gemfile .gitignore _config.yml index.md _layouts/default.html _sections test/check-site.sh
git commit -m "feat: scaffold Jekyll site rendering six sections from Markdown"
```

---

### Task 2: Sidebar navigation, responsive layout, and mobile menu toggle

**Files:**
- Modify: `_layouts/default.html`
- Create: `styles.css`
- Create: `script.js`
- Modify: `test/check-site.sh`

**Interfaces:**
- Consumes: `ordered_sections` and each section's `nav_id`/`title` from Task 1.
- Produces: a `#site-nav` `<nav>` element (`aria-label="Section navigation"`) containing `<a href="#{{ nav_id }}">` links generated from the same collection; a `.nav-toggle` button (`aria-controls="site-nav"`, `aria-expanded`) that Task 3/4 do not touch; CSS custom properties `--bg`, `--surface`, `--text`, `--border`, `--accent` on `:root`, which Task 4 overrides for dark mode; `script.js` containing one IIFE for mobile-toggle behavior, which Tasks 3 and 4 append further IIFEs to.

- [ ] **Step 1: Add the Task 2 assertions to test/check-site.sh**

Insert the following lines into `test/check-site.sh`, directly above the `if [ "$FAILURES" -eq 0 ]` block:

```bash
# --- Task 2: sidebar nav + mobile toggle markup ---
assert_contains _site/index.html 'id="site-nav"' "nav has expected id"
assert_contains _site/index.html 'aria-label="Section navigation"' "nav has accessible label"
assert_contains _site/index.html 'href="#welcome"' "nav links to welcome section"
assert_contains _site/index.html 'href="#contact"' "nav links to contact section"
assert_contains _site/index.html 'aria-controls="site-nav"' "mobile toggle references nav via aria-controls"
assert_contains _site/index.html 'styles.css' "page links the stylesheet"
assert_contains _site/index.html 'script.js' "page links the script"
```

- [ ] **Step 2: Run the test script and confirm the new assertions fail**

Run: `bash test/check-site.sh`
Expected: the seven new lines report `FAIL` (nav, stylesheet, and script don't exist yet); the Task 1 assertions still `PASS`.

- [ ] **Step 3: Create styles.css**

```css
:root {
  --bg: #ffffff;
  --surface: #f5f5f5;
  --text: #1a1a1a;
  --border: #d0d0d0;
  --accent: #00478f;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

a {
  color: var(--accent);
}

:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

.nav-toggle {
  display: none;
}

#site-nav {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1.5rem 1rem;
}

#site-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

#site-nav li + li {
  margin-top: 0.5rem;
}

#site-nav a {
  display: block;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  border-left: 3px solid transparent;
}

main {
  padding: 2rem 1.5rem;
  max-width: 42rem;
}

@media (min-width: 768px) {
  body {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 100vh;
  }

  #site-nav {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }
}

@media (max-width: 767.98px) {
  .nav-toggle {
    display: block;
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1.25rem;
    background: var(--surface);
    border: none;
    border-bottom: 1px solid var(--border);
    text-align: left;
  }

  #site-nav {
    display: none;
  }

  #site-nav.is-open {
    display: block;
  }
}
```

- [ ] **Step 4: Create script.js with the mobile-toggle IIFE**

```javascript
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  nav.addEventListener('click', function (event) {
    if (event.target.tagName === 'A') {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
```

- [ ] **Step 5: Update _layouts/default.html to add the stylesheet, nav, toggle button, and script**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ site.title }}</title>
  <link rel="stylesheet" href="{{ '/styles.css' | relative_url }}">
</head>
<body>
  {% assign ordered_sections = site.sections | sort: "order" %}

  <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">
    <span class="visually-hidden">Toggle navigation menu</span>
    <span aria-hidden="true">&#9776;</span>
  </button>

  <nav id="site-nav" aria-label="Section navigation">
    <ul>
      {% for section in ordered_sections %}
      <li><a href="#{{ section.nav_id }}">{{ section.title }}</a></li>
      {% endfor %}
    </ul>
  </nav>

  <main>
    {% for section in ordered_sections %}
    <section id="{{ section.nav_id }}">
      <h2>{{ section.title }}</h2>
      {{ section.content }}
    </section>
    {% endfor %}
  </main>

  <script src="{{ '/script.js' | relative_url }}"></script>
</body>
</html>
```

- [ ] **Step 6: Run the test script and confirm all assertions pass**

Run: `bash test/check-site.sh`
Expected: all `PASS`, exit code 0.

- [ ] **Step 7: Manually verify responsive and keyboard behavior in a browser**

Run: `bundle exec jekyll serve` and open `http://127.0.0.1:4000` in a browser.
- Resize the window below 768px wide: confirm the sidebar is hidden and the hamburger button is visible at the top.
- Click the hamburger button: confirm the nav appears and the button's `aria-expanded` becomes `true` (check via browser dev tools).
- Click a nav link on mobile: confirm the page jumps to that section and the menu closes automatically.
- Resize above 768px: confirm the sidebar is permanently visible and the hamburger is hidden.
- Using only Tab/Shift+Tab and Enter/Space, confirm the hamburger (on mobile width) and each nav link are reachable and show a visible focus outline.
- With browser dev tools set to emulate `prefers-reduced-motion: reduce`, click a nav link and confirm the page jumps instantly instead of animating.

- [ ] **Step 8: Commit**

```bash
git add _layouts/default.html styles.css script.js test/check-site.sh
git commit -m "feat: add sidebar navigation with responsive mobile toggle"
```

---

### Task 3: Scroll-spy active-section highlighting

**Files:**
- Modify: `script.js`
- Modify: `styles.css`
- Modify: `test/check-site.sh`

**Interfaces:**
- Consumes: `#site-nav a` links and `main section` elements from Task 2.
- Produces: a second IIFE in `script.js` that toggles an `.is-active` class onto the nav link matching the section currently in view; a `#site-nav a.is-active` CSS rule providing both a color and non-color (border + weight) indicator.

- [ ] **Step 1: Add the Task 3 assertions to test/check-site.sh**

Insert the following lines into `test/check-site.sh`, directly above the `if [ "$FAILURES" -eq 0 ]` block:

```bash
# --- Task 3: scroll-spy wiring ---
assert_contains script.js 'IntersectionObserver' "script.js sets up an IntersectionObserver for scroll-spy"
assert_contains styles.css '.is-active' "styles.css defines an active nav-link state"
```

- [ ] **Step 2: Run the test script and confirm the new assertions fail**

Run: `bash test/check-site.sh`
Expected: the two new lines report `FAIL`; all Task 1/2 assertions still `PASS`.

- [ ] **Step 3: Append the scroll-spy IIFE to script.js**

```javascript
(function () {
  var navLinks = document.querySelectorAll('#site-nav a');
  var sections = document.querySelectorAll('main section');

  if (!navLinks.length || !sections.length || !('IntersectionObserver' in window)) {
    return;
  }

  var linksById = {};
  navLinks.forEach(function (link) {
    linksById[link.getAttribute('href').slice(1)] = link;
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var link = linksById[entry.target.id];
        if (!link) {
          return;
        }
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) {
            l.classList.remove('is-active');
          });
          link.classList.add('is-active');
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });
})();
```

- [ ] **Step 4: Add the active-state rule to styles.css**

Add this rule after the existing `#site-nav a { ... }` rule:

```css
#site-nav a.is-active {
  border-left-color: var(--accent);
  font-weight: 600;
}
```

- [ ] **Step 5: Run the test script and confirm all assertions pass**

Run: `bash test/check-site.sh`
Expected: all `PASS`, exit code 0.

- [ ] **Step 6: Manually verify scroll-spy behavior in a browser**

Run: `bundle exec jekyll serve` and open `http://127.0.0.1:4000`.
- Scroll slowly through the page and confirm the highlighted nav link (bold text + left border in `--accent`) updates to match whichever section is in view.
- Confirm the highlight is visible in a way that doesn't rely on color alone (the bold weight and border are present even if you can't distinguish the accent color).
- Note: the current placeholder sections are similar lengths, so this doesn't yet exercise the "very short section" case from Review Focus — flag this for a follow-up check once real content replaces the placeholders (tracked in Task 5's editing guide).

- [ ] **Step 7: Commit**

```bash
git add script.js styles.css test/check-site.sh
git commit -m "feat: add scroll-spy highlighting for the active section"
```

---

### Task 4: Light/dark theme toggle with persistence

**Files:**
- Modify: `_layouts/default.html`
- Modify: `styles.css`
- Modify: `script.js`
- Modify: `test/check-site.sh`

**Interfaces:**
- Consumes: `--bg`/`--surface`/`--text`/`--border`/`--accent` custom properties from Task 2.
- Produces: a `#theme-toggle` button; a `data-theme` attribute on `<html>` reflecting the active theme; an inline `<script>` in `<head>` that applies a stored theme before first paint; a third IIFE in `script.js` handling the toggle's click behavior and `localStorage` persistence.

- [ ] **Step 1: Add the Task 4 assertions to test/check-site.sh**

Insert the following lines into `test/check-site.sh`, directly above the `if [ "$FAILURES" -eq 0 ]` block:

```bash
# --- Task 4: theme toggle wiring ---
assert_contains _site/index.html 'id="theme-toggle"' "theme toggle button renders"
assert_contains script.js 'matchMedia' "script.js checks the OS color-scheme preference"
assert_contains styles.css 'data-theme="dark"' "styles.css defines dark-theme overrides"
```

- [ ] **Step 2: Run the test script and confirm the new assertions fail**

Run: `bash test/check-site.sh`
Expected: the three new lines report `FAIL`; all earlier assertions still `PASS`.

- [ ] **Step 3: Add dark-theme and toggle-button rules to styles.css**

Add these rules after the `:root { ... }` block at the top of the file:

```css
:root[data-theme="dark"] {
  --bg: #121212;
  --surface: #1e1e1e;
  --text: #f0f0f0;
  --border: #3a3a3a;
  --accent: #7ab8f5;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #121212;
    --surface: #1e1e1e;
    --text: #f0f0f0;
    --border: #3a3a3a;
    --accent: #7ab8f5;
  }
}
```

Add this rule near the `.nav-toggle` rule:

```css
#theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 20;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 1.25rem;
  cursor: pointer;
}
```

- [ ] **Step 4: Append the theme-toggle IIFE to script.js**

```javascript
(function () {
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    return;
  }

  function currentTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr) {
      return attr;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // localStorage unavailable (e.g. private browsing); theme choice won't persist.
    }
  }

  applyTheme(currentTheme());

  toggle.addEventListener('click', function () {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
})();
```

- [ ] **Step 5: Update _layouts/default.html: add the anti-flash inline script and the toggle button**

Add this inline script as the first thing inside `<head>`, before the `<link rel="stylesheet">` tag:

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.setAttribute('data-theme', stored);
      }
    } catch (e) {
      // localStorage unavailable; fall back to the OS color-scheme preference.
    }
  })();
</script>
```

Add the toggle button as the first element inside `<body>`, before the existing `.nav-toggle` button:

```html
<button type="button" id="theme-toggle" aria-label="Switch to dark theme">
  <span aria-hidden="true">&#9788;</span>
</button>
```

- [ ] **Step 6: Run the test script and confirm all assertions pass**

Run: `bash test/check-site.sh`
Expected: all `PASS`, exit code 0.

- [ ] **Step 7: Verify color contrast**

Using a contrast checker (e.g. the browser DevTools accessibility panel, or webaim.org/resources/contrastchecker), confirm:
- Light theme: `--text` (`#1a1a1a`) on `--bg` (`#ffffff`) meets 7:1; `--accent` (`#00478f`) on `--bg` meets 4.5:1.
- Dark theme: `--text` (`#f0f0f0`) on `--bg` (`#121212`) meets 7:1; `--accent` (`#7ab8f5`) on `--bg` meets 4.5:1.
If any pair falls short, darken/lighten that color slightly and re-check before moving on.

- [ ] **Step 8: Manually verify theme behavior in a browser**

Run: `bundle exec jekyll serve` and open `http://127.0.0.1:4000`.
- Confirm the page matches your OS's light/dark setting by default.
- Click the theme toggle: confirm colors swap and the button's accessible label updates (check via dev tools).
- Reload the page: confirm the chosen theme persists.
- Open the page in a private/incognito window with storage restricted, and confirm the page still loads and the toggle still works within that session (no crash), even though the choice won't persist after closing the window.

- [ ] **Step 9: Commit**

```bash
git add _layouts/default.html styles.css script.js test/check-site.sh
git commit -m "feat: add light/dark theme toggle with persistence"
```

---

### Task 5: Content-editing guide and full end-to-end verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the complete site from Tasks 1–4.
- Produces: no new code — a documentation update and a final manual verification pass covering the Review Focus items not yet explicitly exercised (JavaScript disabled, keyboard-only use end-to-end).

- [ ] **Step 1: Add a content-editing guide to README.md**

Append this section to `README.md`:

```markdown
## Editing the site's content

This site's text lives entirely in the `_sections/` folder, as one Markdown file per section. To change what's on the page:

1. On GitHub, open the file for the section you want to change (e.g. `_sections/01-welcome.md`).
2. Click the pencil icon to edit it.
3. Edit the text below the `---` front matter block. You can use standard Markdown: **bold**, [links](https://example.com), and lists.
4. Do not change the `nav_id` or `order` values unless you know what they do:
   - `nav_id` must be unique across all six files — it's used as the section's anchor link.
   - `order` controls where the section appears on the page (1 is first, 6 is last).
5. Scroll down and commit your change directly to the main branch.

GitHub Pages rebuilds the site automatically after your commit — the update is usually live within a minute.
```

- [ ] **Step 2: Manually verify the site works with JavaScript disabled**

Run: `bundle exec jekyll serve`, open the page, then disable JavaScript in the browser's dev tools and reload.
Expected: all six sections' text is fully visible and readable; the page still matches the OS light/dark preference (this is pure CSS); the theme toggle and hamburger button may be inert, but nothing is hidden or broken.

- [ ] **Step 3: Manually verify full keyboard-only navigation**

With the mouse untouched, using only Tab/Shift+Tab and Enter/Space:
- On a narrow (mobile-width) viewport, tab to the hamburger button, activate it with Enter or Space, and confirm the nav opens with a visible focus outline throughout.
- Tab through each of the six nav links and confirm each shows a visible focus outline and jumps to its section on Enter.
- Tab to the theme toggle and confirm it switches themes on Enter or Space.

- [ ] **Step 4: Run the full test suite one final time**

Run: `bash test/check-site.sh`
Expected: all `PASS`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add content-editing guide for non-technical contributors"
```
