/**
 * ViajeNYC.com — Main JavaScript v4
 * Navigation, FAQ accordion, Shorts embed loader, scroll effects
 */

(function () {
  'use strict';

  /* ============================================================
     NAVIGATION
     ============================================================ */

  const navToggle = document.getElementById('nav-toggle');
  const navMenu   = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      const isOpen = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // Mobile submenu toggles
  document.querySelectorAll('.site-nav__toggle-sub').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const sub    = this.nextElementSibling;
      const isOpen = sub.classList.toggle('is-open');
      this.setAttribute('aria-expanded', String(isOpen));
    });
  });

  // Close nav on desktop resize
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1024 && navMenu) {
      navMenu.classList.remove('is-open');
      document.body.style.overflow = '';
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Highlight active nav link
  var currentPath = window.location.pathname;
  document.querySelectorAll('.site-nav__link, .site-nav__sub a').forEach(function (link) {
    if (link.getAttribute('href') === currentPath) {
      link.style.color = 'var(--yellow)';
    }
  });

  /* ============================================================
     FAQ ACCORDION
     ============================================================ */

  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var answer  = this.nextElementSibling;
      var isOpen  = answer.classList.contains('is-open');

      // Close all open answers in same FAQ list
      var parent = this.closest('.faq-list');
      if (parent) {
        parent.querySelectorAll('.faq-answer.is-open').forEach(function (a) {
          a.classList.remove('is-open');
        });
        parent.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(function (q) {
          q.setAttribute('aria-expanded', 'false');
        });
      }

      if (!isOpen) {
        answer.classList.add('is-open');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ============================================================
     SHORTS MODULE LOADER
     ============================================================ */

  async function loadShortsModule(container) {
    var src = container.dataset.shortsSrc;
    if (!src) return;

    try {
      var response = await fetch(src);
      if (!response.ok) throw new Error('HTTP ' + response.status);

      var data  = await response.json();
      var strip = container.querySelector('.shorts-strip');
      if (!strip) return;

      if (!data.items || data.items.length === 0) {
        renderShortsPronto(strip, data.title || 'este tema');
        return;
      }

      var shortsItems = [];
      var fullItems   = [];
      data.items.forEach(function (item) {
        if (!resolveVideoId(item) && !resolveVideoHref(item)) return;
        if (classifyItem(item) === 'full') {
          fullItems.push(item);
        } else {
          shortsItems.push(item);
        }
      });

      if (shortsItems.length > 0) {
        renderShortsCards(strip, shortsItems);
        initRailNav(strip);
      } else {
        renderShortsPronto(strip, data.title || 'este tema');
      }

      if (fullItems.length > 0) {
        var innerEl     = strip.closest('.container') || strip.parentNode;
        var fullSection = createFullVideoSection(fullItems);
        innerEl.appendChild(fullSection);
        initRailNav(fullSection.querySelector('.videos-full-strip'));
      }

    } catch (err) {
      var mod = container.closest('.shorts-module');
      if (mod) mod.remove();
    }
  }

  /* ── Classification ── */

  function classifyItem(item) {
    var dur      = Number(item.duration_seconds) || 0;
    var url      = String(item.url || '');
    var watchUrl = String(item.watch_url || '');
    var title    = String(item.title || '').toLowerCase();
    var isShortUrl = url.indexOf('/shorts/') !== -1;

    // Rule 2: explicitly longer than 90 s → full video
    if (dur > 90) return 'full';

    // Rule 4: long-form title keywords + no /shorts/ URL → full video
    if (!isShortUrl) {
      var longForm = ['guía completa', 'guia completa', 'tour completo', 'documental', 'vlog completo'];
      for (var i = 0; i < longForm.length; i++) {
        if (title.indexOf(longForm[i]) !== -1) return 'full';
      }
      // Rule 3: no /shorts/ URL, duration unknown, but has a watch_url → full video
      if (dur === 0 && watchUrl.length > 10) return 'full';
    }

    // Rules 1 & 3: /shorts/ URL (any duration ≤ 90 or unknown) → short
    return 'short';
  }

  /* ── Full Videos section builder ── */

  function createFullVideoSection(items) {
    var sec = document.createElement('div');
    sec.className = 'videos-full-section';
    sec.innerHTML =
      '<div class="videos-full-section__header">' +
        '<h3 class="videos-full-section__title">Videos completos</h3>' +
      '</div>' +
      '<div class="videos-full-strip"></div>';
    renderFullVideoCards(sec.querySelector('.videos-full-strip'), items);
    return sec;
  }

  function renderFullVideoCards(strip, items) {
    strip.innerHTML = '';
    items.forEach(function (item) {
      var vid  = resolveVideoId(item);
      var href = resolveVideoHref(item);
      if (!vid && !href) return;

      var card = document.createElement('div');
      card.className = 'full-video-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', (item.title || 'Ver video') + ' — reproducir');

      var thumbSrc = resolveThumbSrc(item);
      var thumbEl  = thumbSrc
        ? '<img class="full-video-card__thumb" src="' + escapeHtml(thumbSrc) + '" alt="" loading="lazy">'
        : '<div class="full-video-card__thumb"></div>';

      var metaParts = [];
      if (item.channel) metaParts.push(escapeHtml(item.channel));
      var views    = formatViews(item.view_count);
      var duration = formatDuration(item.duration_seconds);
      if (views)    metaParts.push(escapeHtml(views) + ' vis.');
      if (duration) metaParts.push(escapeHtml(duration));
      var metaEl = metaParts.length
        ? '<span class="full-video-card__meta">' + metaParts.join(' · ') + '</span>'
        : '';

      var linkEl = href
        ? '<a href="' + escapeHtml(href) + '" class="full-video-card__link" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">Ver en YouTube ↗</a>'
        : '';

      card.innerHTML =
        '<div class="full-video-card__thumb-wrap">' +
          thumbEl +
          '<div class="full-video-card__play" aria-hidden="true">' +
            '<div class="full-video-card__play-icon"></div>' +
          '</div>' +
        '</div>' +
        '<div class="full-video-card__info">' +
          '<p class="full-video-card__title">' + escapeHtml(item.title || '') + '</p>' +
          metaEl +
          linkEl +
        '</div>';

      function activate() {
        if (vid) {
          embedFullVideo(card, vid, href || ('https://www.youtube.com/watch?v=' + encodeURIComponent(vid)), item.title || '');
        } else if (href) {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }

      card.addEventListener('click', function (e) {
        if (e.target.classList.contains('full-video-card__link')) return;
        activate();
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });

      strip.appendChild(card);
    });
  }

  function embedFullVideo(card, videoId, watchUrl, title) {
    var safe     = encodeURIComponent(videoId);
    var embedUrl = 'https://www.youtube.com/embed/' + safe + '?autoplay=1&rel=0&modestbranding=1';
    card.innerHTML =
      '<div class="full-video-card__embed">' +
        '<iframe' +
          ' src="' + escapeHtml(embedUrl) + '"' +
          ' title="' + escapeHtml(title) + '"' +
          ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
          ' allowfullscreen' +
        '></iframe>' +
        '<a href="' + escapeHtml(watchUrl) + '"' +
          ' class="full-video-card__yt-link"' +
          ' target="_blank" rel="noopener noreferrer"' +
          ' aria-label="Ver en YouTube">' +
          'Ver en YouTube ↗' +
        '</a>' +
      '</div>';
    card.classList.add('full-video-card--playing');
    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-label');
  }

  /* ── Shorts cards ── */

  function renderShortsCards(strip, items) {
    strip.innerHTML = '';
    items.forEach(function (item) {
      var vid  = resolveVideoId(item);
      var href = resolveVideoHref(item);
      if (!vid && !href) return;

      var card = document.createElement('div');
      card.className = 'shorts-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', (item.title || 'Ver video') + ' — reproducir');

      var thumbSrc = resolveThumbSrc(item);
      var thumbEl  = thumbSrc
        ? '<img class="shorts-card__thumb" src="' + escapeHtml(thumbSrc) + '" alt="" loading="lazy">'
        : '<div class="shorts-card__thumb" aria-hidden="true"></div>';

      var metaParts = [];
      if (item.channel) metaParts.push(escapeHtml(item.channel));
      var views    = formatViews(item.view_count);
      var duration = formatDuration(item.duration_seconds);
      if (views)    metaParts.push(escapeHtml(views) + ' vis.');
      if (duration) metaParts.push(escapeHtml(duration));
      var metaEl = metaParts.length
        ? '<span class="shorts-card__channel">' + metaParts.join(' · ') + '</span>'
        : '';

      card.innerHTML =
        thumbEl +
        '<div class="shorts-card__overlay">' +
          '<div class="shorts-card__play" aria-hidden="true">' +
            '<div class="shorts-card__play-icon"></div>' +
          '</div>' +
          '<span class="shorts-card__type-badge" aria-hidden="true">▶ Shorts</span>' +
          '<p class="shorts-card__title">' + escapeHtml(item.title || '') + '</p>' +
          metaEl +
        '</div>';

      function activate() {
        if (vid) {
          embedShortsVideo(card, vid, href || ('https://www.youtube.com/watch?v=' + encodeURIComponent(vid)), item.title || '');
        } else if (href) {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }

      card.addEventListener('click', activate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });

      strip.appendChild(card);
    });
  }

  function embedShortsVideo(card, videoId, watchUrl, title) {
    var safe     = encodeURIComponent(videoId);
    var embedUrl = 'https://www.youtube.com/embed/' + safe + '?autoplay=1&rel=0&modestbranding=1';
    card.innerHTML =
      '<div class="shorts-card__embed">' +
        '<iframe' +
          ' src="' + escapeHtml(embedUrl) + '"' +
          ' title="' + escapeHtml(title) + '"' +
          ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
          ' allowfullscreen' +
        '></iframe>' +
        '<a href="' + escapeHtml(watchUrl) + '"' +
          ' class="shorts-card__yt-link"' +
          ' target="_blank" rel="noopener noreferrer"' +
          ' aria-label="Ver en YouTube">' +
          'Ver en YouTube ↗' +
        '</a>' +
      '</div>';
    card.classList.add('shorts-card--playing');
    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-label');
  }

  function renderShortsPronto(strip, topicTitle) {
    strip.innerHTML =
      '<div class="shorts-pronto">' +
        '<div class="shorts-pronto__icon" aria-hidden="true">🎬</div>' +
        '<p class="shorts-pronto__title">Próximamente</p>' +
        '<p class="shorts-pronto__text">Pronto agregaremos videos seleccionados sobre ' + escapeHtml(topicTitle) + ' para ayudarte a planificar mejor tu viaje.</p>' +
      '</div>';
  }

  /* ── Rail navigation arrows (shared by shorts + full-video strips) ── */

  function initRailNav(strip) {
    if (!strip || strip.children.length < 3) return;

    // Wrap the strip in a position:relative container for arrow positioning
    var wrap = document.createElement('div');
    wrap.className = 'rail-wrap';
    strip.parentNode.insertBefore(wrap, strip);
    wrap.appendChild(strip);

    var nav = document.createElement('div');
    nav.className = 'rail-nav';
    nav.innerHTML =
      '<button class="rail-nav__btn rail-nav__btn--prev" aria-label="Anterior">&#8249;</button>' +
      '<button class="rail-nav__btn rail-nav__btn--next" aria-label="Siguiente">&#8250;</button>';
    wrap.appendChild(nav);

    var prevBtn = nav.querySelector('.rail-nav__btn--prev');
    var nextBtn = nav.querySelector('.rail-nav__btn--next');

    prevBtn.addEventListener('click', function () {
      strip.scrollBy({ left: -(strip.offsetWidth * 0.75), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      strip.scrollBy({ left:  strip.offsetWidth * 0.75, behavior: 'smooth' });
    });

    function updateArrows() {
      prevBtn.disabled = strip.scrollLeft < 10;
      nextBtn.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 10;
      prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
      nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';
    }

    updateArrows();
    strip.addEventListener('scroll', updateArrows, { passive: true });
  }

  /* ── Utility helpers ── */

  function resolveVideoHref(item) {
    var w = item.watch_url;
    if (w && typeof w === 'string' && w.indexOf('undefined') === -1 && w.length > 10) return w;
    var u = item.url;
    if (u && typeof u === 'string' && u.indexOf('undefined') === -1 && u.length > 10) return u;
    var vid = item.video_id;
    if (vid && typeof vid === 'string' && vid !== 'undefined') return 'https://www.youtube.com/watch?v=' + encodeURIComponent(vid);
    var id = item.id;
    if (id && typeof id === 'string' && id !== 'undefined') return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
    return null;
  }

  function resolveVideoId(item) {
    var vid = item.video_id;
    if (vid && typeof vid === 'string' && vid !== 'undefined' && vid.length > 3) return vid;
    var id = item.id;
    if (id && typeof id === 'string' && id !== 'undefined' && id.length > 3) return id;
    return null;
  }

  function resolveThumbSrc(item) {
    var t = item.thumbnail;
    if (t && typeof t === 'string' && t.indexOf('undefined') === -1 && t.length > 10) return t;
    var vid = item.video_id;
    if (vid && typeof vid === 'string' && vid !== 'undefined') return 'https://img.youtube.com/vi/' + encodeURIComponent(vid) + '/hqdefault.jpg';
    var id = item.id;
    if (id && typeof id === 'string' && id !== 'undefined') return 'https://img.youtube.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg';
    return null;
  }

  function formatViews(n) {
    if (!n || typeof n !== 'number' || n <= 0) return '';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return Math.round(n / 1000) + 'K';
    return String(n);
  }

  function formatDuration(secs) {
    if (!secs || typeof secs !== 'number' || secs <= 0) return '';
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Init all Shorts modules on the page
  document.querySelectorAll('[data-shorts-src]').forEach(loadShortsModule);

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ============================================================
     STICKY NAV SHADOW ON SCROLL
     ============================================================ */

  var siteNav = document.getElementById('site-nav');
  if (siteNav) {
    window.addEventListener('scroll', function () {
      siteNav.style.boxShadow = window.scrollY > 10
        ? '0 2px 30px rgba(0,0,0,0.4)'
        : '0 2px 20px rgba(0,0,0,0.25)';
    }, { passive: true });
  }

  /* ============================================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 72;
        var top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

})();
