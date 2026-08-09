import { Page, expect } from '@playwright/test';

export async function loginAsCandidate(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="you@example.com"], input[placeholder*="username"]', 'xasefe9251@bejum.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]:has-text("Sign In")');
  // Wait for navigation away from /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
}

export async function loginAsEmployer(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="you@example.com"], input[placeholder*="username"]', 'weqolyji@forexzig.com');
  await page.fill('input[type="password"]', '87654321');
  await page.click('button[type="submit"]:has-text("Sign In")');
  // Wait for navigation away from /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
}
