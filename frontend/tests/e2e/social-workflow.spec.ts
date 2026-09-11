import { test, expect } from '@playwright/test';
import { loginAsCandidate, loginAsEmployer } from './helpers';

const B_USERNAME = 'amittest2';
const B_PROFILE = `/profile/${B_USERNAME}`;

test.describe('Social workflow: follow, connect, message, feed (local E2E)', () => {
  test('A follows B, state persists across reload, unfollow works', async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto(B_PROFILE, { waitUntil: 'domcontentloaded' });

    const followBtn = page.getByRole('button', { name: 'Follow', exact: true });
    await expect(followBtn).toBeVisible({ timeout: 30000 });
    await followBtn.click();

    const followingBtn = page.getByRole('button', { name: 'Following', exact: true });
    await expect(followingBtn).toBeVisible({ timeout: 15000 });

    // persistence across reload
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(followingBtn).toBeVisible({ timeout: 30000 });

    // unfollow + persistence
    await followingBtn.click();
    await expect(followBtn).toBeVisible({ timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(followBtn).toBeVisible({ timeout: 30000 });

    // leave A following B so the feed test below has network visibility
    await followBtn.click();
    await expect(followingBtn).toBeVisible({ timeout: 15000 });
  });

  test('A sends connection request (pending), B accepts, both see connected', async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto(B_PROFILE, { waitUntil: 'domcontentloaded' });

    // The page renders a default "Connect" button until the connection state
    // fetch resolves — wait for it so we don't click a pre-hydration button.
    await page.waitForResponse(
      (r) => r.url().includes('/api/network/connections') && r.request().method() === 'GET',
      { timeout: 30000 }
    );

    const connectBtn = page.getByRole('button', { name: 'Connect', exact: true });
    await expect(connectBtn).toBeVisible({ timeout: 30000 });
    await connectBtn.click();

    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible({ timeout: 30000 });

    // B accepts on /network received tab
    await loginAsEmployer(page);
    await page.goto('/network', { waitUntil: 'domcontentloaded' });
    const receivedTab = page.locator('button:has-text("Received Requests")');
    await expect(receivedTab).toBeVisible({ timeout: 30000 });
    await receivedTab.click();

    const acceptBtn = page.getByRole('button', { name: 'Accept', exact: true }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 15000 });
    await acceptBtn.click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-sonner-toast]').first()).not.toContainText('error', { timeout: 5000 });

    // A now sees the connected state on B's profile (a Message link, no "Connected" text)
    await loginAsCandidate(page);
    await page.goto(B_PROFILE, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'Message', exact: true }).first()).toBeVisible({ timeout: 30000 });
  });

  test('A messages B and the bubble renders; B sees it in the conversation list', async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto(`/messages?user=${B_USERNAME}`, { waitUntil: 'domcontentloaded' });

    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible({ timeout: 30000 });
    const msg = `[E2E local] hello from A ${Date.now()}`;
    await textarea.fill(msg);
    await page.locator('button[aria-label="Send message"]').click();
    await expect(page.locator(`text=${msg}`)).toBeVisible({ timeout: 15000 });

    // B sees the conversation + message
    await loginAsEmployer(page);
    await page.goto('/messages', { waitUntil: 'domcontentloaded' });
    const convButtons = page.locator('div.divide-y button, div.overflow-y-auto button');
    await expect(convButtons.first()).toBeVisible({ timeout: 30000 });
    await convButtons.first().click();
    await expect(page.locator(`text=${msg}`)).toBeVisible({ timeout: 15000 });
  });

  test('A posts to feed, B likes and comments; counts persist after reload', async ({ page }) => {
    await loginAsCandidate(page);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });

    const postText = `E2E test post ${Date.now()}`;
    await page.getByPlaceholder('Share something with your network...').fill(postText);
    await page.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(page.getByText(postText, { exact: true })).toBeVisible({ timeout: 30000 });

    // B likes via UI
    await loginAsEmployer(page);
    await page.goto('/feed', { waitUntil: 'domcontentloaded' });
    const card = page.locator('div.bg-bg-secondary').filter({ hasText: postText }).first();
    await expect(card).toBeVisible({ timeout: 30000 });

    const likeBtn = card.getByRole('button').first();
    await likeBtn.click();
    await expect(card.getByRole('button').first()).toContainText('1', { timeout: 15000 });

    // B comments via API (no comment UI on /feed), then verify count on reload
    const feedRes = await page.request.get('/api/feed?limit=20');
    expect(feedRes.ok()).toBeTruthy();
    const feedBody = await feedRes.json();
    const post = (feedBody.posts || []).find((p: any) => p.content === postText);
    expect(post).toBeTruthy();
    const commentRes = await page.request.post(`/api/feed/posts/${post.id}/comment`, {
      data: { content: 'Nice post from B!' },
    });
    expect(commentRes.ok()).toBeTruthy();

    await page.reload({ waitUntil: 'domcontentloaded' });
    const cardAfter = page.locator('div.bg-bg-secondary').filter({ hasText: postText }).first();
    // comments span textContent is " 1" (JSX whitespace before the count)
    await expect(cardAfter.locator('span').filter({ hasText: /^\s*1\s*$/ }).first()).toBeVisible({ timeout: 30000 });
  });
});