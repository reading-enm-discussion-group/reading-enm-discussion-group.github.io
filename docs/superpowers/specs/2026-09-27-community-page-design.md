# Community Group Static Page — Design

## Purpose

A single static web page for a community reading/discussion group, hosted on
GitHub Pages. The page must be easy to read, welcoming, and accessible to a
wide range of users. Content is organized into six sections that a visitor
can browse by scrolling or jump to directly via navigation.

## Requirements

- Six content sections (text only, no images); content to be supplied by the
  site owner after this design is implemented.
- A side navigation menu listing the six section headings.
  - Clicking a heading jumps to that section.
  - While scrolling, the navigation highlights whichever section is
    currently in view.
- Clean, professional visual style with a simple, highly readable typeface.
- Accessible and inclusive: strong color contrast, semantic HTML, full
  keyboard operability.
- Responsive: works well on both mobile and desktop viewports.
- Light and dark themes:
  - Defaults to the visitor's OS/browser preference
    (`prefers-color-scheme`).
  - A visible toggle lets the visitor override the default; the override
    persists across visits (`localStorage`).
- No build step — plain HTML/CSS/JS that deploys directly via GitHub Pages.

## Architecture

Flat, dependency-free static site:

```
index.html      # page structure and content placeholders
styles.css      # layout, typography, color themes
script.js       # scroll-spy navigation + theme toggle
```

No framework, bundler, or package manager is introduced. This matches the
project's current state (a bare GitHub Pages repo) and keeps maintenance
simple for a community site that may be edited by non-developers later.

## Layout & Navigation

**Desktop (≥768px):**
- Two-column layout: a fixed-position sidebar (~20–25% width) on the left
  listing the six section headings as links; main content (~75–80% width)
  on the right.
- The sidebar remains visible while the content scrolls.
- The link for the section currently in the viewport is visually
  highlighted (distinct color/weight, plus a non-color indicator such as a
  left border, so the state isn't conveyed by color alone).

**Mobile (<768px):**
- The sidebar collapses behind a hamburger toggle button fixed near the top
  of the page.
- Opening the menu shows the six section links as a full-width list.
- Selecting a link scrolls to that section and closes the menu.
- The toggle button has an accessible label and reflects expanded/collapsed
  state via `aria-expanded`.

**Scroll-spy behavior:**
- Implemented with `IntersectionObserver` watching each section, avoiding
  scroll-event polling.
- Clicking a nav link scrolls smoothly to the target section
  (`scroll-behavior: smooth`, with a check for
  `prefers-reduced-motion` to fall back to instant jumps).

## Styling & Theming

- **Typeface:** system font stack
  (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) —
  no web font download, native rendering on every platform.
- **Color themes:** defined as CSS custom properties on `:root`, with a
  `prefers-color-scheme: dark` media query for the default, and a
  `data-theme="light"` / `data-theme="dark"` attribute on `<html>` that the
  toggle script sets to force an explicit choice, overriding the media
  query.
- **Contrast:** body text targets at least a 7:1 contrast ratio (WCAG AAA)
  against its background in both themes; interactive elements meet at
  least WCAG AA (4.5:1).
- **Theme toggle:** a sun/moon icon button in the top-right corner of the
  page, keyboard-operable, with an accessible name that states the action
  ("Switch to dark theme" / "Switch to light theme"). Choice is saved to
  `localStorage` and re-applied on load before first paint (inline
  `<script>` in `<head>`) to avoid a flash of the wrong theme.

## Accessibility

- Semantic landmarks: `<nav>` for the sidebar, `<main>` for content,
  `<h1>`/`<h2>` heading hierarchy matching the six sections.
- All interactive elements (nav links, hamburger toggle, theme toggle)
  reachable and operable via keyboard, with visible focus states.
- Section headings are also the accessible names used in the nav, so
  screen reader users hear consistent labels in both places.
- No content is conveyed by color alone (see scroll-spy indicator above).

## Content Structure

Six `<section>` elements, each with an `id` matching its nav link's `href`
and an `<h2>` heading. Content for each section is a placeholder until the
site owner supplies the real text; structure and styling do not depend on
the final word count, but the layout should be checked once real content
is dropped in to confirm section lengths don't cause awkward scroll-spy
jumps (very short sections triggering rapid highlight changes).

## Out of Scope

- Images, icons beyond the theme-toggle icon, or other media.
- A build pipeline, CSS/JS framework, or package manager.
- Multi-page navigation (this is a single page).
- CMS or dynamic content — all text is hand-edited in `index.html`.
