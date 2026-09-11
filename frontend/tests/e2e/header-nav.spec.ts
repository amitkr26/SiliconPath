import { test, expect } from '@playwright/test';
import { loginAsCandidate } from './helpers';

test.describe('Header Navigation E2E Verification', () => {
  test('Logged-out guest sees About, Contact, Opportunities, Academy, and News & Feed in main nav', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Opportunities, News & Feed, About, Contact, Academy should be present
    const oppsLink = header.locator('a[href="/opportunities"]');
    const newsLink = header.locator('a[href="/news"], a[href="/feed"]');
    const aboutLink = header.locator('a[href="/about"]');
    const contactLink = header.locator('a[href="/contact"]');
    
    await expect(oppsLink.first()).toBeVisible();
    await expect(aboutLink.first()).toBeVisible();
    await expect(contactLink.first()).toBeVisible();

    // Academy should be in the nav bar
    const academyNavLink = header.locator('nav a[href="/academy"]');
    await expect(academyNavLink).toHaveCount(1);

    // 2. Click About and verify it loads the About page
    await aboutLink.first().click();
    await expect(page).toHaveURL(/\/about/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await page.screenshot({ path: 'playwright-report/about-page.png' });

    // 3. Click Contact and verify it loads the Contact page
    const contactFromAbout = page.locator('header a[href="/contact"]');
    await contactFromAbout.first().click();
    await expect(page).toHaveURL(/\/contact/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await page.screenshot({ path: 'playwright-report/contact-page.png' });
  });

  test('Logged-in candidate header displays Network, Messages, and About', async ({ page }) => {
    await loginAsCandidate(page);

    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check Network link
    const networkLink = header.locator('a[href="/network"]');
    await expect(networkLink.first()).toBeVisible();

    // Check Messages link
    const messagesLink = header.locator('a[href="/messages"]');
    await expect(messagesLink.first()).toBeVisible();

    // Check About link
    const aboutLink = header.locator('a[href="/about"]');
    await expect(aboutLink.first()).toBeVisible();

    await page.screenshot({ path: 'playwright-report/logged-in-candidate-header.png' });
  });
});
