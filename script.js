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

(function () {
  var navLinks = document.querySelectorAll('#site-nav a');
  var sections = document.querySelectorAll('main section');
  var endSentinel = document.getElementById('scroll-end-sentinel');

  if (!navLinks.length || !sections.length || !('IntersectionObserver' in window)) {
    return;
  }

  function setActive(link) {
    navLinks.forEach(function (l) {
      l.classList.remove('is-active');
    });
    link.classList.add('is-active');
  }

  var linksById = {};
  navLinks.forEach(function (link) {
    linksById[link.getAttribute('href').slice(1)] = link;
    // Give instant feedback on click rather than waiting for the observer,
    // which matters most for a short final section that barely enters
    // the trigger band on its own.
    link.addEventListener('click', function () {
      setActive(link);
    });
  });

  var lastLink = navLinks[navLinks.length - 1];

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }
        // The sentinel sits after the last section, so it still enters
        // the trigger band near the bottom of the page even when the
        // last section itself is too short to ever reach that band.
        var link = entry.target === endSentinel ? lastLink : linksById[entry.target.id];
        if (link) {
          setActive(link);
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });

  if (endSentinel) {
    observer.observe(endSentinel);
  }
})();

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

  // Updates the toggle's label to match the theme currently in effect,
  // without forcing an explicit override — an unvisited OS preference
  // stays live (e.g. tracks the OS switching at sunset) until the user
  // actually clicks the toggle.
  function reflectTheme(theme) {
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  // Sets an explicit, persisted override. Only called from the click
  // handler — never on load — so visiting the page doesn't itself bake
  // in whatever the OS happened to prefer at the time.
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    reflectTheme(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // localStorage unavailable (e.g. private browsing); theme choice won't persist.
    }
  }

  reflectTheme(currentTheme());

  toggle.addEventListener('click', function () {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
})();
