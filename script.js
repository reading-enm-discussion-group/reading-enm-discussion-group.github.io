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
