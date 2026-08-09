import { test, expect } from '@playwright/test';
import { loginAsCandidate } from './helpers';

test.describe('Network & Connect E2E Verification', () => {
  test('Candidate logs in, visits /network, and clicks Connect without foreign key error toast', async ({ page }) => {
    // 1. Log in as Candidate
    await loginAsCandidate(page);

    // 2. Navigate to Network page
    await page.goto('/network', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Professional VLSI Network');

    // 3. Locate suggested profile card Connect buttons inside the grid (exact button name "Connect")
    const cardConnectButtons = page.locator('div.grid button:has-text("Connect")');
    await expect(cardConnectButtons.first()).toBeVisible({ timeout: 15000 });

    const count = await cardConnectButtons.count();
    console.log(`Found ${count} Connect buttons on profile cards`);
    expect(count).toBeGreaterThan(0);

    // 4. Click the profile card's Connect button
    await cardConnectButtons.first().click();

    // 5. Assert: Check for toast feedback and ensure NO foreign key error appears
    const toast = page.locator('[data-sonner-toast]');
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
    
    const toastText = await toast.first().textContent();
    console.log('Real UI Toast captured after clicking profile Connect button:', toastText);

    // Assert absence of foreign key error
    expect(toastText).not.toContain('violates foreign key constraint');
    expect(toastText).not.toContain('connections_requester_id_fkey');

    await page.screenshot({ path: 'playwright-report/network-connect-clicked.png' });
  });
});
