// Language toggle. Korean lives in the HTML itself; English comes from i18n-en.js.
// Numbers stay in the HTML only, so both languages always show the same figures.
(function () {
  var DICTS = { en: window.I18N_EN || {} };
  var nodes = document.querySelectorAll('[data-i18n]');
  var buttons = document.querySelectorAll('.lang button');

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

  function initial() {
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

  document.querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });

  var start = initial();
  if (start !== 'ko') apply(start);
})();
