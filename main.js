// Language toggle. Korean lives in the HTML itself; English comes from i18n-en.js.
// Numbers stay in the HTML only, so both languages always show the same figures.
(function () {
  document.documentElement.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DICTS = { en: window.I18N_EN || {} };
  var nodes = document.querySelectorAll('[data-i18n]');
  var buttons = document.querySelectorAll('.lang button');

  /* ── i18n ─────────────────────────────────────────── */
  function apply(lang) {
    nodes.forEach(function (el) {
      if (el.dataset.ko === undefined) el.dataset.ko = el.innerHTML;
      var text = lang === 'ko' ? el.dataset.ko : DICTS[lang][el.dataset.i18n];
      if (text !== undefined) el.innerHTML = text;
    });
    document.documentElement.lang = lang;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }

  function initialLang() {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'ko') return q;
    try {
      var saved = localStorage.getItem('lang');
      if (saved === 'en' || saved === 'ko') return saved;
    } catch (e) {}
    return 'ko';
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      apply(b.dataset.lang);
      var url = new URL(location.href);
      url.searchParams.set('lang', b.dataset.lang);
      history.replaceState(null, '', url);
    });
  });

  var start = initialLang();
  if (start !== 'ko') apply(start);

  /* ── Count-up numbers ─────────────────────────────── */
  function fmt(v, dec) {
    return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  var printing = false;
  function finalCount(el) {
    el.textContent = fmt(parseFloat(el.dataset.count), parseInt(el.dataset.dec || '0', 10));
  }
  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || '0', 10);
    if (reduce || printing) { finalCount(el); return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (printing) { finalCount(el); return; }
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased, dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── Reveal + chart + counters on scroll ──────────────
     Fails open: the observer is only the fast path. sweep() reveals anything
     whose top has entered the viewport, so content never stays hidden. */
  var targets = Array.prototype.slice.call(document.querySelectorAll('.reveal, .chart, .incident, .tele, .dash, .ship__stats'));
  var io = null;
  function show(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    if (io) io.unobserve(el);
  }
  function sweep() {
    var edge = innerHeight * 0.92;
    targets = targets.filter(function (t) {
      if (t.getBoundingClientRect().top < edge) { show(t); return false; }
      return true;
    });
  }
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) show(e.target); });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
    sweep();
    addEventListener('load', sweep);
    addEventListener('resize', sweep);
  } else {
    targets.forEach(show); targets = [];
  }
  addEventListener('beforeprint', function () {
    printing = true;
    targets.forEach(show); targets = [];
    document.querySelectorAll('[data-count]').forEach(finalCount);
  });
  addEventListener('afterprint', function () { printing = false; });

  /* ── Odometer + progress bar + active nav ─────────── */
  var odo = document.getElementById('odo');
  var bar = document.getElementById('progress');
  var TOTAL = 55219; // 5,219 km (Army) + 50,000 km (own car)
  var navLinks = document.querySelectorAll('.bar__nav a');
  var sections = Array.prototype.map.call(navLinks, function (a) {
    return document.querySelector(a.getAttribute('href'));
  });
  var ticking = false;
  if (!odo || !bar) return;

  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    var p = max > 0 ? Math.min(scrollY / max, 1) : 0;
    var km = Math.round(TOTAL * p);
    odo.textContent = String(km).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1,$2');
    bar.style.transform = 'scaleX(' + p + ')';
    var current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-on', i === current); });
    if (targets.length) sweep();
    ticking = false;
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();
})();
