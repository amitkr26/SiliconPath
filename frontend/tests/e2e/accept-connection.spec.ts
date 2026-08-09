import { test, expect } from '@playwright/test';
import { loginAsEmployer } from './helpers';

test.describe('Accept Connection E2E Verification', () => {
  test('Employer logs in, views /network received requests, and verifies connection request interface in UI', async ({ page }) => {
    // 1. Log in as Employer
    await loginAsEmployer(page);

    // 2. Navigate to Network received tab
    await page.goto('/network', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Professional VLSI Network');

    // Click Received Requests Tab
    const receivedTab = page.locator('button:has-text("Received Requests")');
    await expect(receivedTab).toBeVisible({ timeout: 10000 });
    await receivedTab.click();
    await page.waitForTimeout(1500);

    // Check if there is an Accept button or empty state
    const acceptBtn = page.locator('button:has-text("Accept")');
    if (await acceptBtn.count() > 0) {
      await acceptBtn.first().click();
      await page.waitForTimeout(2000);

      // Verify toast or UI update
      const toast = page.locator('[data-sonner-toast]');
      if (await toast.isVisible()) {
        const toastText = await toast.textContent();
        console.log('Employer Accept Connection Toast:', toastText);
        expect(toastText).not.toContain('violates foreign key constraint');
      }
    } else {
      // Empty state or existing connections
      await expect(page.locator('text=Received Connection Requests')).toBeVisible();
    }

    await page.screenshot({ path: 'playwright-report/employer-network-received.png' });
  });
});
