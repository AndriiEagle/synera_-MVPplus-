// C04.L4 — М'який блок: приховати профіль від конкретних людей і категорій.
// Gate (READINESS_DNA): прихована людина не бачить прихованих полів; жодного повідомлення їм.
// Детерміновано, чисто: без мережі, без Date.now(), без побічних ефектів і без сповіщень.
//
// Напрямок: блок належить ВЛАСНИКУ профілю. Коли глядач переглядає профіль власника,
// застосовується блок САМЕ ЦЬОГО власника. Ніякого зворотного сповіщення глядачеві немає.
import { filterProfileForAudience } from './field-audience.mjs';

const MAX_LABEL = 64;
const isValidLabel = value => typeof value === 'string' && value.length > 0 && value.length <= MAX_LABEL;
const cleanLabels = list => Array.isArray(list)
  ? [...new Set(list.filter(isValidLabel))].sort()
  : [];

/** Скільки сирх міток було відкинуто (некоректні + дублікати). */
const countDropped = list => Array.isArray(list) ? list.length - cleanLabels(list).length : 0;

/** Єдиний fail-closed результат для некоректного підпису на межі allowlist. */
const rejected = () => ({ valid: false, reason: 'INVALID_LABEL' });

/**
 * Створює політику м'якого блоку. Вхід не мутується.
 * Некоректні/дублікативні мітки відкидаються, але НЕ мовчки: коли щось
 * відкинуто, у результаті з'являється поле `dropped: { people, categories }`
 * з кількістю відкинутих сирх значень (fail-closed звітність).
 * @param {{ hiddenPeople?: string[], hiddenCategories?: string[] }} input
 */
export function createSoftBlock(input = {}) {
  const hiddenPeople = cleanLabels(input?.hiddenPeople);
  const hiddenCategories = cleanLabels(input?.hiddenCategories);
  const droppedPeople = countDropped(input?.hiddenPeople);
  const droppedCategories = countDropped(input?.hiddenCategories);
  if (droppedPeople > 0 || droppedCategories > 0) {
    return { hiddenPeople, hiddenCategories, dropped: { people: droppedPeople, categories: droppedCategories } };
  }
  return { hiddenPeople, hiddenCategories };
}

function normalizeBlock(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return createSoftBlock();
  return createSoftBlock(block);
}

/**
 * Повертає НОВИЙ блок із доданою людиною (ідемпотентно).
 * Fail-closed: некоректний підпис (не-рядок, порожній, >64 символів)
 * НЕ мовчки ігнорується — повертається { valid: false, reason: 'INVALID_LABEL' },
 * щоб власник знав, що людина НЕ прихована.
 */
export function addHiddenPerson(block, personId) {
  if (!isValidLabel(personId)) return rejected();
  const current = normalizeBlock(block);
  return { hiddenPeople: cleanLabels([...current.hiddenPeople, personId]), hiddenCategories: current.hiddenCategories };
}

/**
 * Повертає НОВИЙ блок із доданою категорією (ідемпотентно).
 * Fail-closed: некоректний підпис → { valid: false, reason: 'INVALID_LABEL' }.
 */
export function addHiddenCategory(block, category) {
  if (!isValidLabel(category)) return rejected();
  const current = normalizeBlock(block);
  return { hiddenPeople: current.hiddenPeople, hiddenCategories: cleanLabels([...current.hiddenCategories, category]) };
}

/**
 * Повертає НОВИЙ блок без вказаного підпису (і з людей, і з категорій).
 * Fail-closed: некоректний підпис → { valid: false, reason: 'INVALID_LABEL' }.
 */
export function removeHidden(block, label) {
  if (!isValidLabel(label)) return rejected();
  const current = normalizeBlock(block);
  return {
    hiddenPeople: current.hiddenPeople.filter(value => value !== label),
    hiddenCategories: current.hiddenCategories.filter(value => value !== label),
  };
}

/**
 * Чи прихований глядач від власника цього блоку.
 * @param {{ id?: string, categories?: string[] }} viewer
 * @param {{ hiddenPeople?: string[], hiddenCategories?: string[] }} block — блок ВЛАСНИКА
 */
export function isViewerHidden(viewer, block) {
  if (!viewer || typeof viewer !== 'object' || Array.isArray(viewer)) return false;
  const current = normalizeBlock(block);
  if (typeof viewer.id === 'string' && current.hiddenPeople.includes(viewer.id)) return true;
  const categories = Array.isArray(viewer.categories) ? viewer.categories : [];
  return categories.some(category => current.hiddenCategories.includes(category));
}

/**
 * Застосовує видимість: спершу м'який блок власника, потім рівні аудиторії (C04.L3).
 * Прихований глядач не бачить НІЧОГО; решта бачать лише дозволені поля.
 * @returns {Object} профіль (порожній об'єкт для прихованого глядача)
 */
export function applyVisibility(ownerProfile, viewer, options = {}) {
  if (isViewerHidden(viewer, options.softBlock)) return {};
  const filtered = filterProfileForAudience(ownerProfile, viewer, options.audienceOverrides || {});
  return filtered && typeof filtered === 'object' ? filtered : {};
}

/**
 * Виключає з результатів пошуку профілі, чиї власники приховали цього глядача.
 * @param {Array<{id: string}>} profiles
 * @param {{ id?: string, categories?: string[] }} viewer
 * @param {Record<string, object>} blockByOwnerId — блоки власників за їх id
 */
export function filterDiscoverable(profiles, viewer, blockByOwnerId = {}) {
  if (!Array.isArray(profiles)) return [];
  const blocks = blockByOwnerId && typeof blockByOwnerId === 'object' ? blockByOwnerId : {};
  return profiles.filter(profile => {
    if (!profile || typeof profile !== 'object' || typeof profile.id !== 'string') return false;
    return !isViewerHidden(viewer, blocks[profile.id]);
  });
}