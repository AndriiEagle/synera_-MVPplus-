// web_launch/need-decay.mjs — Математичний модуль експоненційного згасання та лімітів потреб (C02.L3)
// Формула: S(t) = S_0 * exp(-Delta_t / tau)

export const DEFAULT_TAU_DAYS = 30.0;
export const DEFAULT_CUTOFF_SCORE = 0.10;
export const MAX_ACTIVE_NEEDS_PER_PERSON = 3;

export function calculateNeedFreshness(createdAt, now = new Date(), tauDays = DEFAULT_TAU_DAYS) {
  const createdTime = typeof createdAt === 'string' || typeof createdAt === 'number' ? new Date(createdAt).getTime() : createdAt.getTime();
  const currentTime = typeof now === 'string' || typeof now === 'number' ? new Date(now).getTime() : now.getTime();

  if (isNaN(createdTime) || isNaN(currentTime)) {
    return { score: 0.0, is_stale: true, age_days: 0 };
  }

  const deltaMs = Math.max(0, currentTime - createdTime);
  const deltaDays = deltaMs / (1000 * 60 * 60 * 24);

  // Експоненційне згасання актуальності
  const score = Math.exp(-deltaDays / tauDays);
  const isStale = score < DEFAULT_CUTOFF_SCORE;

  return {
    score: Number(score.toFixed(4)),
    is_stale: isStale,
    age_days: Number(deltaDays.toFixed(2))
  };
}

export function filterAndLimitNeeds(needs, options = {}) {
  const {
    now = new Date(),
    cutoffScore = DEFAULT_CUTOFF_SCORE,
    maxPerPerson = MAX_ACTIVE_NEEDS_PER_PERSON,
    tauDays = DEFAULT_TAU_DAYS
  } = options;

  if (!Array.isArray(needs)) return [];

  // 1. Оцінюємо свіжість кожного оголошення
  const evaluated = needs.map(need => {
    const freshness = calculateNeedFreshness(need.created_at || need.timestamp, now, tauDays);
    return {
      ...need,
      freshness
    };
  });

  // 2. Відсікаємо застарілі потреби
  const freshOnly = evaluated.filter(n => !n.freshness.is_stale && n.freshness.score >= cutoffScore);

  // 3. Застосовуємо b-matching обмеження: не більше maxPerPerson на користувача
  const perPersonCount = new Map();
  const boundedNeeds = [];

  for (const n of freshOnly) {
    const owner = n.owner_id || n.user_id || 'anonymous';
    const currentCount = perPersonCount.get(owner) || 0;
    if (currentCount < maxPerPerson) {
      perPersonCount.set(owner, currentCount + 1);
      boundedNeeds.push(n);
    }
  }

  return boundedNeeds;
}
