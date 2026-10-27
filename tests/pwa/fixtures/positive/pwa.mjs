if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('/sw.mjs', { type: 'module', updateViaCache: 'none' })
    .then(() => {})
    .catch(() => { /* online page keeps working */ });
}
