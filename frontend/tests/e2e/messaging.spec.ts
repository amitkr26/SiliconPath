import { test, expect } from '@playwright/test';
import { loginAsCandidate } from './helpers';

test.describe('Direct Messaging E2E Verification', () => {
  test('Candidate logs in, selects conversation on /messages, types and sends a message, and asserts it appears on screen', async ({ page }) => {
    // 1. Log in as Candidate
    await loginAsCandidate(page);

    // 2. Navigate to Messages page
    await page.goto('/messages', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toContainText('Direct Messages');

    // 3. Locate conversation thread buttons in the conversation list
    const convButtons = page.locator('div.divide-y button, div.overflow-y-auto button');
    await expect(convButtons.first()).toBeVisible({ timeout: 15000 });

    // Click the first conversation thread
    await convButtons.first().click();
    await page.waitForTimeout(1000);

    // 4. Locate message textarea input
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 10000 });

    const testMessageText = `[Playwright Live UI] Testing at ${Date.now()}`;
    await textarea.fill(testMessageText);

    // 5. Click Send button
    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // 6. Assert that the message text appears as a message bubble in the active conversation thread
    const sentMessageBubble = page.locator(`text=${testMessageText}`);
    await expect(sentMessageBubble).toBeVisible({ timeout: 15000 });

    console.log('Real UI message bubble successfully rendered on screen:', testMessageText);
    await page.screenshot({ path: 'playwright-report/messaging-thread-sent.png' });
  });
});
