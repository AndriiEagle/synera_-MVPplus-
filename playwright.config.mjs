// Playwright browser E2E. Сервер спавниться всередині spec (beforeAll) —
// конфіг тримає лише ранер-налаштування. Запуск: `npx playwright test` з КОРЕНЯ репо.
// serviceWorkers: 'block' — перша активація SW у pwa.mjs тригерить controllerchange →
// location.reload(), що детерміновано губить кліки в тестах; SW-оновлення тут не ціль перевірки.
export default {
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: { serviceWorkers: 'block' },
};