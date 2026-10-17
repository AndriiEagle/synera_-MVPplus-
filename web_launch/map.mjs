// Approximate city map: no API key, geolocation, address lookup or third-party script.
import { CITIES } from './matching.mjs';
export function worldPoint(lat, lon, zoom = 13) {
  const safeLat = Math.min(85, Math.max(-85, lat));
  const sin = Math.sin(safeLat * Math.PI / 180), scale = 256 * 2 ** zoom;
  return { x: (lon + 180) / 360 * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}
export function visibleTiles(center, width, height, zoom) {
  const p = worldPoint(center.lat, center.lon, zoom), left = p.x - width / 2, top = p.y - height / 2;
  const tiles = [];
  for (let y = Math.floor(top / 256); y <= Math.floor((top + height) / 256); y++) {
    for (let x = Math.floor(left / 256); x <= Math.floor((left + width) / 256); x++) {
      if (x >= 0 && y >= 0 && x < 2 ** zoom && y < 2 ** zoom) tiles.push({ x, y, left: x * 256 - left, top: y * 256 - top });
    }
  }
  return tiles;
}
const CITY_CENTERS = [
  [/^(zürich|zurich|цюрих)$/iu, 47.376, 8.541],
  [/^(baden|баден)$/iu, 47.473, 8.308],
  [/^(winterthur|вінтертур)$/iu, 47.500, 8.724],
];
export function cityLocation(profile) {
  if (profile.map_visible !== true || profile.is_discoverable !== true) return null;
  const selected = CITIES[profile.brief?.city_code];
  if (selected) return { ...profile, lat: selected.lat, lon: selected.lon, place: selected.label + ' · центр міста, не GPS', location_kind: 'city' };
  const city = CITY_CENTERS.find(([pattern]) => pattern.test(String(profile.city || '').trim()));
  return city ? { ...profile, lat: city[1], lon: city[2], place: `${profile.city} · центр міста, не GPS`, location_kind: 'city' } : null;
}
export function createPeopleMap(target, onSelect) {
  let people = [], roads = false, zoom = 13, center = { lat: 47.376, lon: 8.536 };
  const viewport = document.createElement('div'); viewport.className = 'map-viewport';
  viewport.setAttribute('role', 'group'); viewport.setAttribute('aria-label', 'Карта учасників. Точки можна вибрати клавіатурою.');
  const base = document.createElement('div'); base.className = 'map-base';
  const markers = document.createElement('div'); markers.className = 'map-markers';
  const caption = document.createElement('p'); caption.className = 'fine';
  const attribution = document.createElement('a'); attribution.textContent = '© OpenStreetMap contributors';
  attribution.href = 'https://www.openstreetmap.org/copyright'; attribution.target = '_blank'; attribution.rel = 'noopener'; attribution.className = 'map-credit'; attribution.hidden = true;
  viewport.append(base, markers, attribution); target.append(viewport, caption);
  function render() {
    if (!viewport.clientWidth) { base.replaceChildren(); markers.replaceChildren(); return; }
    const width = viewport.clientWidth || 320, height = 360, origin = worldPoint(center.lat, center.lon, zoom);
    base.replaceChildren(); markers.replaceChildren(); attribution.hidden = !roads;
    if (roads) for (const tile of visibleTiles(center, width, height, zoom)) {
      const img = document.createElement('img'); img.alt = ''; img.width = 256; img.height = 256;
      img.referrerPolicy = 'strict-origin-when-cross-origin';
      img.src = `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`;
      img.style.left = `${tile.left}px`; img.style.top = `${tile.top}px`; base.append(img);
      img.addEventListener('error', () => { caption.textContent = 'Фон карти недоступний. Точки та список залишаються доступними.'; });
    }
    let visible = 0;
    for (const [index, person] of people.entries()) {
      const pos = worldPoint(person.lat, person.lon, zoom), x = pos.x - origin.x + width / 2, y = pos.y - origin.y + height / 2;
      if (x < 18 || x > width - 18 || y < 20 || y > height - 25) continue;
      visible++;
      const marker = document.createElement('button'); marker.type = 'button'; marker.className = 'map-marker';
      marker.textContent = `${index + 1}`; marker.title = `${person.display_name} · ${person.place}`;
      marker.setAttribute('aria-label', marker.title); marker.style.left = `${x}px`; marker.style.top = `${y}px`;
      marker.addEventListener('click', () => onSelect(person)); markers.append(marker);
    }
    caption.textContent = `${visible} точок у видимій зоні. ${roads ? 'Фон OpenStreetMap.' : 'Схема без вулиць; фон карти можна ввімкнути окремо.'} Лише центр міста за дозволом учасника. Кілька людей в одному місті мають спільну точку; усі профілі є в списку.`;
  }
  const observer = new ResizeObserver(() => { if (viewport.clientWidth) render(); }); observer.observe(viewport);
  return { setPeople(value) { people = value.map(cityLocation).filter(Boolean); render(); },
    toggleRoads() { roads = !roads; render(); return roads; },
    zoom(delta) { zoom = Math.min(15, Math.max(10, zoom + delta)); render(); },
    focus(person) { const point = cityLocation(person); if (point) { center = point; render(); } },
    reset() { center = { lat: 47.376, lon: 8.536 }; zoom = 13; render(); },
    clear() { people = []; roads = false; render(); },
  };
}
