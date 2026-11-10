import { test, expect } from '@playwright/test';

test('Lumi sends scoped, follow-up and general QA through the real session API', async ({ page }) => {
  test.skip(!process.env.LUMILAB_DATABASE_URL, 'Real PostgreSQL required');
  test.skip((await (await page.request.get('/api/v1/tutor/status')).json()).live_enabled,
    'Offline regression must not spend provider quota');
  await page.goto('/#lumi');
  await page.getByLabel('Hỏi gia sư máy chủ', { exact: true }).check();
  for (const question of ['AgCl là gì', 'Nó có tan trong nước không?', 'Mạch RC là gì?', 'H2O là gì?']) {
    await page.getByLabel('Hỏi Lumi', { exact: true }).fill(question);
    const reply = page.waitForResponse(r => /\/sessions\/[^/]+\/tutor$/.test(new URL(r.url()).pathname));
    await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
    const response = await reply;
    expect(response.status()).toBe(200);
    expect((await response.json()).answer.degraded_reason).toBe('LIVE_DISABLED');
    await expect(page.locator('.chat-message.assistant').last()).toContainText('AI đang tắt');
  }
});

test('Lumi renders formula answers and routes a conversation without unrelated run context', async ({ page }) => {
  // Explicit provider response fixture: checks UI/contract, not model quality.
  await page.route('**/api/v1/sessions', route => route.fulfill({ json: {
    session_id: '00000000-0000-4000-8000-000000000001', session_token: 'fixture-only',
    expires_at: '2099-01-01T00:00:00Z',
  } }));
  const calls: { lab_id: string | null; run_id: string | null; history: { role: string; text: string }[] }[] = [];
  await page.route('**/api/v1/sessions/*/tutor', async route => {
    calls.push(route.request().postDataJSON());
    await route.fulfill({ json: {
      request_id: 'fixture', run: null,
      retrieval: { corpus_revision: 'fixture', retrieval_method: 'local-hybrid-hash', status: 'NO_MATCH', hits: [] },
      answer: { status: 'DRAFT_GUIDANCE', notice: 'Unreviewed fixture', response_source: 'llm',
        degraded_reason: null, model: 'fixture-model', attempts: 1,
        output: { message: 'AgCl là bạc clorua. AgNO3 + NaCl → AgCl + NaNO3.', citation_ids: [], follow_up: null } },
    } });
  });
  await page.goto('/#lumi');
  await page.getByLabel('Hỏi gia sư máy chủ', { exact: true }).check();
  const questions = [
    ['Bạc clorua là gì?', 'precipitation'], ['Nó có tan trong nước không?', 'precipitation'],
    ['Electron trong nguyên tử là gì?', 'atomic'], ['H2O là gì?', null], ['Công thức nào?', null],
  ] as const;
  for (const [index, [question, expectedLab]] of questions.entries()) {
    await page.getByLabel('Hỏi Lumi', { exact: true }).fill(question);
    await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
    await expect(page.locator('.chat-message.assistant')).toHaveCount(index + 1);
    await expect(page.locator('.chat-message.assistant').last()).toContainText('AgNO3');
    expect(calls.at(-1)?.lab_id).toBe(expectedLab);
    expect(calls.at(-1)?.run_id).toBeNull();
  }
  expect(calls[1].history[0].text).toBe('Bạc clorua là gì?');
  await expect(page.locator('.chat-message.assistant').last().locator('.message-notice')).toHaveCount(0);
  await expect(page.locator('.chat-message.assistant').last().locator('.retrieval-box')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cuộc trò chuyện mới', exact: true }).click();
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('Vậy tại sao?');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect(page.locator('.chat-message.assistant').last()).toBeVisible();
  expect(calls.at(-1)?.lab_id).toBeNull();
  expect(calls.at(-1)?.history).toEqual([]);
});
