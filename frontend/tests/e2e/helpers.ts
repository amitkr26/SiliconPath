import { Page, expect } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  // Retry against the React hydration race: if the click lands before the
  // onSubmit handler is attached, the form submits natively (GET /login?),
  // fields clear, and nothing happens. Re-fill and retry.
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.fill('input[placeholder*="you@example.com"], input[placeholder*="username"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    try {
      await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
      return;
    } catch {
      // fall through to retry
    }
  }
  throw new Error(`login failed for ${email}`);
}

export async function loginAsCandidate(page: Page) {
  await login(page, 'xasefe9251@bejum.com', '12345678');
}

export async function loginAsEmployer(page: Page) {
  await login(page, 'weqolyji@forexzig.com', '87654321');
}