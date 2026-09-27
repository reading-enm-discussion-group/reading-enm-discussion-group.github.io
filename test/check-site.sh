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
  local ids duplicates empty_count
  ids=$(grep -oE '<section id="[^"]*"' "$file" | sed -E 's/<section id="([^"]*)"/\1/')
  duplicates=$(echo "$ids" | sort | uniq -d)
  empty_count=$(echo "$ids" | grep -cx '' || true)
  if [ -n "$duplicates" ]; then
    fail "duplicate section id(s) found: $duplicates"
  elif [ "$empty_count" -gt 0 ]; then
    fail "$empty_count section(s) have an empty id"
  else
    pass "all section ids are unique and non-empty"
  fi
}

echo "Building site..."
rm -rf _site
if ! bundle exec jekyll build --quiet; then
  fail "jekyll build failed — see output above"
  echo "$FAILURES check(s) failed."
  exit 1
fi

# --- Task 1: sections render from _sections/*.md, in order, with unique ids ---
assert_contains _site/index.html '<section id="about-us">' "about-us section renders with correct id"
assert_contains _site/index.html '<h2>About Us</h2>' "about-us section has correct heading"
assert_contains _site/index.html '<section id="joining">' "joining section renders with correct id"
assert_contains _site/index.html '<section id="roles">' "roles section renders with correct id"
assert_contains _site/index.html '<section id="topics">' "topics section renders with correct id"
assert_contains _site/index.html '<section id="venues">' "venues section renders with correct id"
assert_contains _site/index.html '<section id="standards-conduct">' "standards-conduct section renders with correct id"
assert_contains _site/index.html '<section id="contact">' "contact section renders with correct id"
assert_order _site/index.html 'id="about-us"' 'id="joining"' "about-us renders before joining"
assert_order _site/index.html 'id="joining"' 'id="roles"' "joining renders before roles"
assert_order _site/index.html 'id="roles"' 'id="topics"' "roles renders before topics"
assert_order _site/index.html 'id="topics"' 'id="venues"' "topics renders before venues"
assert_order _site/index.html 'id="venues"' 'id="standards-conduct"' "venues renders before standards-conduct"
assert_order _site/index.html 'id="standards-conduct"' 'id="contact"' "standards-conduct renders before contact"
assert_unique_section_ids _site/index.html

# --- Task 2: sidebar nav + mobile toggle markup ---
assert_contains _site/index.html 'id="site-nav"' "nav has expected id"
assert_contains _site/index.html 'aria-label="Section navigation"' "nav has accessible label"
assert_contains _site/index.html 'href="#about-us"' "nav links to about-us section"
assert_contains _site/index.html 'href="#contact"' "nav links to contact section"
assert_contains _site/index.html 'aria-controls="site-nav"' "mobile toggle references nav via aria-controls"
assert_contains _site/index.html 'styles.css' "page links the stylesheet"
assert_contains _site/index.html 'script.js' "page links the script"

# --- Task 3: scroll-spy wiring ---
assert_contains script.js 'IntersectionObserver' "script.js sets up an IntersectionObserver for scroll-spy"
assert_contains styles.css '.is-active' "styles.css defines an active nav-link state"

# --- Task 4: theme toggle wiring ---
assert_contains _site/index.html 'id="theme-toggle"' "theme toggle button renders"
assert_contains script.js 'matchMedia' "script.js checks the OS color-scheme preference"
assert_contains styles.css 'data-theme="dark"' "styles.css defines dark-theme overrides"

# --- Final review fixes ---
assert_contains styles.css 'keep the menu on-screen after scrolling' "open mobile nav stays fixed in the viewport instead of scrolling off-screen"
assert_contains styles.css 'keep the icon visible in dark mode' "hamburger toggle has an explicit color so it's visible in dark mode"
assert_contains styles.css 'scroll-margin-top' "sections have scroll-margin-top so the fixed mobile header doesn't cover their heading after a jump"
assert_contains _site/index.html '<h1>' "page has an h1"
assert_contains script.js 'reflectTheme' "initial theme application doesn't persist an unchosen OS-default as an explicit override"
assert_contains _layouts/default.html '| escape' "section titles are HTML-escaped before rendering"
assert_contains _config.yml 'exclude:' "_config.yml excludes non-site files from the Jekyll build"

if [ "$FAILURES" -eq 0 ]; then
  echo "All checks passed."
  exit 0
else
  echo "$FAILURES check(s) failed."
  exit 1
fi
