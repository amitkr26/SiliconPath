import { test, expect } from '@playwright/test';
import { loginAsCandidate } from './helpers';

test.describe('Direct Messaging E2E Verification', () => {
  test('Candidate sends a direct message via ?user=, then sees the conversation in the list and sends another', async ({ page }) => {
    // 1. Log in as Candidate
    await loginAsCandidate(page);

    // 2. Deterministically create/open the conversation with B (no dependency on prior state)
    await page.goto('/messages?user=weqolyji', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Direct Messages');
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 15000 });
    const firstMessage = `[Playwright Live UI] seed ${Date.now()}`;
    await textarea.fill(firstMessage);
    await page.locator('button[aria-label="Send message"]').click();
    await expect(page.locator(`text=${firstMessage}`)).toBeVisible({ timeout: 15000 });

    // 3. Navigate to the conversation list; the seeded conversation must appear.
    //    List container uses "overflow-y-auto" (not divide-y) for the buttons.
    await page.goto('/messages', { waitUntil: 'domcontentloaded' });
    const convBtn = page.locator('div.overflow-y-auto button').filter({ hasText: firstMessage }).first();
    await expect(convBtn).toBeVisible({ timeout: 25000 });
    await convBtn.click();
    await expect(page.locator(`text=${firstMessage}`)).toBeVisible({ timeout: 15000 });

    // 4. Send another message from within the conversation thread
    const textarea2 = page.locator('textarea');
    await expect(textarea2).toBeVisible({ timeout: 10000 });
    const testMessageText = `[Playwright Live UI] Testing at ${Date.now()}`;
    await textarea2.fill(testMessageText);
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
    const sentMessageBubble = page.locator(`text=${testMessageText}`);
    await expect(sentMessageBubble).toBeVisible({ timeout: 15000 });

    console.log('Real UI message bubble successfully rendered on screen:', testMessageText);
    await page.screenshot({ path: 'playwright-report/messaging-thread-sent.png' });
  });
});
