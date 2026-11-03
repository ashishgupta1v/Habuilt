(function () {
  var meta = document.querySelector('meta[name="habuilt-app-env"]');
  var value = meta ? meta.getAttribute('content') : '';
  window.__HABUILT_APP_ENV__ = value || 'production';
})();
