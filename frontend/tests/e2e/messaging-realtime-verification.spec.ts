import { test, expect } from '@playwright/test';
import { loginAsCandidate, loginAsEmployer } from './helpers';

test.describe('Empirical Realtime Messaging Two-Session Test', () => {
  test.setTimeout(120000);

  test('Two concurrent sessions send and receive messages in Realtime without page reload', async ({ browser }) => {
    // 1. Session A setup
    const contextA = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const pageA = await contextA.newPage();

    // 2. Session B setup
    const contextB = await browser.newContext({ baseURL: 'http://localhost:3000' });
    const pageB = await contextB.newPage();

    const consoleErrorsA: string[] = [];
    const consoleErrorsB: string[] = [];
    pageA.on('console', msg => {
      if (msg.type() === 'error') consoleErrorsA.push(msg.text());
    });
    pageB.on('console', msg => {
      if (msg.type() === 'error') consoleErrorsB.push(msg.text());
    });

    const wsFramesA: string[] = [];
    const wsFramesB: string[] = [];
    pageA.on('websocket', ws => {
      ws.on('framereceived', frame => wsFramesA.push(`RECV_A: ${frame.payload}`));
    });
    pageB.on('websocket', ws => {
      ws.on('framereceived', frame => wsFramesB.push(`RECV_B: ${frame.payload}`));
    });

    // Login A (amittest1)
    console.log('Logging in User A (Candidate 1)...');
    await loginAsCandidate(pageA);
    console.log('User A logged in.');

    // Login B (amittest2)
    console.log('Logging in User B (Candidate 2)...');
    await loginAsEmployer(pageB);
    console.log('User B logged in.');

    const conversationId = 'c32a8699-e660-4acc-a817-407e4968962d';

    // Navigate both to the shared conversation
    console.log('Navigating both sessions to conversation:', conversationId);
    await pageA.goto(`/messages?conv=${conversationId}`);
    await pageB.goto(`/messages?conv=${conversationId}`);

    // Wait for message textarea to load
    await pageA.waitForSelector('textarea[placeholder*="Write a message"], textarea', { timeout: 25000 });
    await pageB.waitForSelector('textarea[placeholder*="Write a message"], textarea', { timeout: 25000 });

    // Wait 3s for Realtime channels to connect
    await pageA.waitForTimeout(3000);
    await pageB.waitForTimeout(3000);

    // 3. User A sends a unique test message
    const msgTextA = `Empirical-RT-Test-${Date.now()}`;
    console.log(`User A sending message: "${msgTextA}"`);
    const sendTimeA = Date.now();
    await pageA.fill('textarea', msgTextA);
    await pageA.click('button:has-text("Send"), button[aria-label="Send message"], button:has(svg.lucide-send)');

    // 4. User B MUST receive and render the message WITHOUT refreshing the page
    console.log('Waiting for User B to receive message via Realtime without page refresh...');
    const receivedLocatorB = pageB.locator(`text=${msgTextA}`);
    await expect(receivedLocatorB).toBeVisible({ timeout: 15000 });
    const receiveDurationA = Date.now() - sendTimeA;
    console.log(`✅ User B received message via Realtime in ${receiveDurationA}ms!`);

    // Verify it renders exactly once in B's view
    const countB = await receivedLocatorB.count();
    expect(countB).toBe(1);
    console.log(`✅ Message renders exactly once in User B DOM (count = ${countB})`);

    // 5. Reverse direction: User B sends a message to User A
    const msgTextB = `Reverse-RT-Test-${Date.now()}`;
    console.log(`User B sending reply: "${msgTextB}"`);
    const sendTimeB = Date.now();
    await pageB.fill('textarea', msgTextB);
    await pageB.click('button:has-text("Send"), button[aria-label="Send message"], button:has(svg.lucide-send)');

    // User A receives without refresh
    console.log('Waiting for User A to receive reply via Realtime...');
    const receivedLocatorA = pageA.locator(`text=${msgTextB}`);
    await expect(receivedLocatorA).toBeVisible({ timeout: 15000 });
    const receiveDurationB = Date.now() - sendTimeB;
    console.log(`✅ User A received reverse message via Realtime in ${receiveDurationB}ms!`);

    // Verify exactly once in A's view
    const countA = await receivedLocatorA.count();
    expect(countA).toBe(1);

    // 6. Test mobile viewport on Session A
    console.log('Testing mobile-width viewport (375px)...');
    await pageA.setViewportSize({ width: 375, height: 667 });
    await pageA.waitForTimeout(1000);
    await expect(receivedLocatorA).toBeVisible();
    console.log('✅ Message thread verified responsive on 375px mobile viewport');

    console.log(`Summary: WebSocket messages received on B: ${wsFramesB.length}, on A: ${wsFramesA.length}`);
    console.log(`Console errors A: ${consoleErrorsA.length}, B: ${consoleErrorsB.length}`);

    // Clean up
    await contextA.close();
    await contextB.close();
  });
});
