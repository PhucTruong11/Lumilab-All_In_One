import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const labs = ['pendulum', 'chemistry', 'circuit', 'mechanics', 'spring', 'parallel-circuit', 'capacitor', 'precipitation', 'gas-reaction'];
test.skip(!process.env.LUMILAB_DATABASE_URL, 'Requires migrated PostgreSQL');

test('each lab saves a server recomputation and restores its own session history after reload', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#lab/pendulum');
  const history = page.getByRole('region', { name: 'Lịch sử theo phiên trên máy chủ' });
  for (const id of labs) {
    await page.getByLabel('Chuyển bài thực hành').selectOption(id);
    await page.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
    await page.getByText('Lịch sử theo phiên trên máy chủ', { exact: true }).click();
    const saved = page.waitForResponse(response =>
      /\/api\/v1\/sessions\/[^/]+\/runs$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'POST');
    await history.getByRole('button', { name: 'Lưu lượt này lên máy chủ' }).click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const run = await response.json();
    expect(run.lab_id).toBe(id);
    expect(run.result).toMatchObject({
      status: 'INSUFFICIENT_DATA', code: 'REVIEWED_EVIDENCE_REQUIRED', facts: {}, evidence: [],
    });
    expect(run.result.preview).toBeTruthy();
    await expect(history.getByText('Đã lưu lượt thử theo phiên trên máy chủ.')).toBeVisible();
    await page.reload();
    await page.getByText('Lịch sử theo phiên trên máy chủ', { exact: true }).click();
    const row = history.getByRole('listitem');
    await expect(row).toHaveCount(1);
    await row.locator('summary').click();
    await expect(row).toContainText('Dữ liệu chưa duyệt');
    expect(JSON.parse((await row.locator('pre').nth(1).textContent())!))
      .toEqual(JSON.parse(JSON.stringify(run.result.preview)));
    await page.getByText('Dự đoán & giải thích', { exact: false }).first().click();
    await page.getByRole('button', { name: 'Hỏi Lumi về lượt thử' }).click();
    const selector = page.getByLabel('Lượt đã lưu trên máy chủ', { exact: true });
    await expect(selector.locator('option')).toHaveCount(2);
    await selector.selectOption(run.run_id);
    await page.getByLabel('Hỏi Lumi', { exact: true }).fill('Cho mình xem lượt đã lưu');
    const detail = page.waitForResponse(reply => new URL(reply.url()).pathname.endsWith('/runs/' + run.run_id));
    await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
    expect((await detail).status()).toBe(200);
    const answer = page.locator('.chat-message.assistant').last();
    await expect(answer).toContainText('Dữ liệu chưa duyệt · Preview của lượt đã lưu');
    const [key, value] = Object.entries(run.result.preview)[0];
    await expect(answer).toContainText(key + ' = ' + (value === null ? '—' : String(value)));
    await page.goto('/#lab/' + id);
  }
});

test('PostgreSQL isolates sessions and deduplicates concurrent retries', async ({ request }) => {
  const first = await request.post('/api/v1/sessions');
  const second = await request.post('/api/v1/sessions');
  expect(first.status()).toBe(201);
  expect(second.status()).toBe(201);
  const owner = await first.json();
  const outsider = await second.json();
  const endpoint = '/api/v1/sessions/' + owner.session_id + '/runs';
  const headers = { Authorization: 'Bearer ' + owner.session_token };
  const config = JSON.parse(await readFile(new URL('../../packages/lab-engine/labs/atomic/lab.json', import.meta.url), 'utf-8'));
  const data = {
    lab_id: 'atomic', model_version: config.model_version, dataset_version: config.dataset_version,
    parameters: config.defaults, elapsed_s: 0, idempotency_key: crypto.randomUUID(),
  };

  expect((await request.post(endpoint, { headers, data: { ...data, preview: { charge_e: 99 } } })).status()).toBe(422);
  const results = await Promise.all([request.post(endpoint, { headers, data }), request.post(endpoint, { headers, data })]);
  expect(results.map(result => result.status()).sort()).toEqual([200, 201]);
  expect((await results[0].json()).run_id).toBe((await results[1].json()).run_id);
  expect((await request.post(endpoint, { headers, data: { ...data, elapsed_s: 1 } })).status()).toBe(409);
  const list = endpoint + '?lab_id=atomic';
  expect((await request.get(list)).status()).toBe(401);
  expect((await request.get(list, { headers: { Authorization: 'Bearer ' + outsider.session_token } })).status()).toBe(401);
  const history = await request.get(list, { headers });
  const { items } = await history.json();
  expect(items).toHaveLength(1);
  const [saved] = items;
  const detail = endpoint + '/' + saved.run_id;
  expect((await request.get(detail, { headers })).status()).toBe(200);
  expect((await request.get(detail, { headers: { Authorization: 'Bearer ' + outsider.session_token } })).status()).toBe(401);
  const outsiderDetail = '/api/v1/sessions/' + outsider.session_id + '/runs/' + saved.run_id;
  expect((await request.get(outsiderDetail, { headers: { Authorization: 'Bearer ' + outsider.session_token } })).status()).toBe(404);

});
