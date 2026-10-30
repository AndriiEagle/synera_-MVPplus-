// Classic head script: choose the existing public/LAB surface before it can flash.
// No storage, network calls, content inspection or new consent is involved.
(() => {
  const url=new URL(location.href);
  document.documentElement.dataset.simulationMode=url.hash.includes('key=')||url.searchParams.has('person')||url.searchParams.has('lab')?'lab':'living';
})();
