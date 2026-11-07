import { test, expect } from '@playwright/test';

// TUTOR-02 acceptance cases 3-6 (cases 1-2 are covered by tutor-pipeline.spec.ts).
// Session cases need a real PostgreSQL, mirroring the existing server-tutor spec.

test('case 3: an unknown session token is rejected, never a fake success', async ({ request }) => {
  test.skip(!process.env.LUMILAB_DATABASE_URL, 'Real PostgreSQL required');
  const created = await request.post('http://127.0.0.1:8002/api/v1/sessions');
  expect(created.status()).toBe(201);
  const { session_id } = await created.json();
  const rejected = await request.get(`http://127.0.0.1:8002/api/v1/sessions/${session_id}/runs?lab_id=pendulum`, {
    headers: { Authorization: 'Bearer not-a-real-token' },
  });
  expect(rejected.status()).toBe(401);
});

test('case 4: a run list is never readable with another session token', async ({ request }) => {
  test.skip(!process.env.LUMILAB_DATABASE_URL, 'Real PostgreSQL required');
  const a = await (await request.post('http://127.0.0.1:8002/api/v1/sessions')).json();
  const b = await (await request.post('http://127.0.0.1:8002/api/v1/sessions')).json();
  const cross = await request.get(`http://127.0.0.1:8002/api/v1/sessions/${a.session_id}/runs?lab_id=pendulum`, {
    headers: { Authorization: `Bearer ${b.session_token}` },
  });
  expect(cross.status()).toBe(401);
  const own = await request.get(`http://127.0.0.1:8002/api/v1/sessions/${a.session_id}/runs?lab_id=pendulum`, {
    headers: { Authorization: `Bearer ${a.session_token}` },
  });
  expect(own.status()).toBe(200);
});

test('case 5: a failed retrieval request is not shown as a successful answer', async ({ page }) => {
  await page.route('**/api/v1/retrieval/query', route => route.abort());
  await page.goto('/#lumi');
  await page.getByLabel('Tra cứu học liệu có nguồn', { exact: true }).check();
  await page.getByLabel('Cách truy xuất', { exact: true }).selectOption('hybrid');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('khối lượng chu kỳ');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  const answer = page.locator('.chat-message.assistant').last();
  await expect(answer).toBeVisible();
  // A connection failure must not be dressed up as a grounded, cited answer.
  await expect(answer).not.toContainText('LicenseRef-LumiLab-Draft');
  await expect(answer).not.toContainText('Truy xuất kết hợp BM25 + vector');
});

test('case 6: displayed citations match the retrieval payload exactly', async ({ page }) => {
  await page.goto('/#lumi');
  await page.getByLabel('Tra cứu học liệu có nguồn', { exact: true }).check();
  await page.getByLabel('Cách truy xuất', { exact: true }).selectOption('hybrid');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('khối lượng chu kỳ');
  const reply = page.waitForResponse(r => r.url().endsWith('/retrieval/query'));
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  const result = await (await reply).json();
  expect(result.hits.length).toBeGreaterThan(0);
  const first = result.hits[0].document;
  const answer = page.locator('.chat-message.assistant').last();
  // The UI may only show provenance that the API actually returned:
  // the real document title and license, plus the draft disclosure.
  await expect(answer).toContainText(first.title);
  await expect(answer).toContainText(first.provenance.license);
  await expect(answer).toContainText('Dữ liệu chưa duyệt');
});
