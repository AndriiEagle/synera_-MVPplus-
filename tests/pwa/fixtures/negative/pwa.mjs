navigator.serviceWorker.register('sw.mjs');
navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
