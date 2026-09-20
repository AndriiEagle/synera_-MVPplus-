
export function initIcebergCascade() {
  const source = new EventSource('/api/cascade/stream');
  
  source.onmessage = (event) => {
    try {
      const state = JSON.parse(event.data);
      applyCascadeState(state);
    } catch (err) {
      console.error('Failed to parse cascade state:', err);
    }
  };

  source.onerror = (err) => {
    console.error('Cascade stream error:', err);
    // Browser automatically reconnects EventSource
  };
}

function applyCascadeState(state) {
  // 1. Inject tokens as CSS variables
  if (state.tokens) {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(state.tokens)) {
      root.style.setProperty(key, value);
    }
  }

  // 2. Rearrange DOM blocks based on layout array
  if (state.layout && Array.isArray(state.layout)) {
    const main = document.querySelector('main');
    if (!main) return;
    
    // Elements mapping by data-block-id or ID
    // Suppose 'hero' = .intro, 'matching' = .cards, 'pricing' = #pricing etc.
    const blocks = {
      'hero': document.querySelector('.intro'),
      'welcome': document.querySelector('.welcome'),
      'matching': document.querySelector('#matching-panel') || document.querySelector('.cards'),
    };
    
    // Sort them in the DOM according to state.layout
    let prevElement = null;
    for (const blockId of state.layout) {
      const el = blocks[blockId];
      if (el) {
        if (prevElement) {
          main.insertBefore(el, prevElement.nextSibling);
        } else {
          main.insertBefore(el, main.firstChild);
        }
        prevElement = el;
      }
    }
  }
}

// Auto-init if running in browser
if (typeof window !== 'undefined' && window.EventSource) {
  initIcebergCascade();
}
