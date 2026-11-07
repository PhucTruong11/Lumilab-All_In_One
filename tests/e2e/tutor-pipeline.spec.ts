import { test, expect } from '@playwright/test';

test('Lumi discloses API live status without a provider call', async ({ page }) => {
  const status = await (await page.request.get('/api/v1/tutor/status')).json();
  await page.goto('/#lumi');
  await page.getByLabel('Hỏi gia sư máy chủ', { exact: true }).check();
  await expect(page.locator('.chat-disclosure')).toContainText(
    status.live_enabled ? 'AI bật khi đủ điều kiện' : 'AI tắt, dùng mẫu');
});
test('basic question receives a concise Tutor answer without unrelated RAG cards', async ({ page }) => {
  test.skip(!process.env.LUMILAB_DATABASE_URL, 'Real PostgreSQL required');
  test.skip((await (await page.request.get('/api/v1/tutor/status')).json()).live_enabled,
    'Template assertions require offline Tutor; do not spend live provider quota');
  await page.goto('/#lumi');
  await page.getByLabel('Tra cứu học liệu có nguồn', { exact: true }).check();
  await page.getByLabel('Hỏi gia sư máy chủ', { exact: true }).check();
  await expect(page.getByLabel('Tra cứu học liệu có nguồn', { exact: true })).not.toBeChecked();
  await expect(page.locator('.chat-disclosure')).toHaveText('Gia sư máy chủ · AI tắt, dùng mẫu');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('Mạch điện là gì');
  const reply = page.waitForResponse(response => /\/sessions\/[^/]+\/tutor$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  expect((await (await reply).json()).answer.degraded_reason).toBe('FOUNDATION_TEMPLATE');
  const answer = page.locator('.chat-message.assistant').last();
  await expect(answer.locator('.message-body')).toContainText('mạch điện gồm nguồn');
  await expect(answer.locator('.message-body')).not.toContainText('đối chiếu điều vừa quan sát');
  await expect(answer.locator('.retrieval-box')).toHaveCount(0);
  await expect(answer.locator('.message-notice')).toHaveText('Dữ liệu chưa duyệt');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('Mạch điện nối tiếp là sao');
  const seriesReply = page.waitForResponse(response => /\/sessions\/[^/]+\/tutor$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  expect((await (await seriesReply).json()).answer.degraded_reason).toBe('FOUNDATION_TEMPLATE');
  await expect(page.locator('.chat-message.assistant').last().locator('.message-body')).toContainText('cùng một đường đi');
});
test('THCS learning sources stay separated from THPT and remain draft', async ({ page }) => {
  await page.goto('/#lumi');
  await page.getByLabel('Tra cứu học liệu có nguồn', { exact: true }).check();
  await page.getByLabel('Cách truy xuất', { exact: true }).selectOption('hybrid');
  await page.getByLabel('Bậc học', { exact: true }).selectOption('THCS');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('Khối lượng chu kỳ con lắc');
  const reply = page.waitForResponse(r => r.url().endsWith('/retrieval/query'));
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  const result = await (await reply).json();
  expect(result.hits.length).toBeGreaterThan(0);
  expect(result.hits.every((hit: { document: { review_status: string; provenance: { level: string } } }) =>
    hit.document.provenance.level === 'THCS' && ['draft', 'reviewed'].includes(hit.document.review_status))).toBeTruthy();
  await expect(page.locator('.chat-message.assistant').last()).toContainText('Quan sát chu kỳ con lắc');
});

test('hybrid source query shows build-index citations and review state', async ({ page }) => {
  await page.goto('/#lumi');
  await page.getByLabel('Tra cứu học liệu có nguồn', { exact: true }).check();
  await page.getByLabel('Cách truy xuất', { exact: true }).selectOption('hybrid');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('khối lượng chu kỳ');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  const answer = page.locator('.chat-message.assistant').last();
  await expect(answer).toContainText('Truy xuất kết hợp BM25 + vector');
  await expect(answer).toContainText('Dữ liệu chưa duyệt');
  await expect(answer).toContainText('LicenseRef-LumiLab-Draft');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('bitcoin stock tomorrow');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect(page.locator('.chat-message.assistant').last()).toContainText('Chưa tìm thấy học liệu');
});

test('server tutor fetches owned run and uses disclosed template while live is off', async ({ page }) => {
  test.skip(!process.env.LUMILAB_DATABASE_URL, 'Real PostgreSQL required');
  test.skip((await (await page.request.get('/api/v1/tutor/status')).json()).live_enabled,
    'Template assertions require offline Tutor; do not spend live provider quota');
  await page.goto('/#lab/pendulum');
  await page.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  const history = page.getByRole('region', { name: 'Lịch sử theo phiên trên máy chủ' });
  await page.getByText('Lịch sử theo phiên trên máy chủ', { exact: true }).click();
  await history.getByRole('button', { name: 'Lưu lượt này lên máy chủ' }).click();
  await expect(history.getByText('Đã lưu lượt thử theo phiên trên máy chủ.')).toBeVisible();
  await page.getByRole('button', { name: '✦ Lumi', exact: true }).click();
  await page.getByLabel('Dùng lượt thử hiện tại', { exact: true }).check();
  const select = page.getByLabel('Lượt đã lưu trên máy chủ', { exact: true });
  await expect(select.locator('option')).toHaveCount(2);
  await select.selectOption({ index: 1 });
  await page.getByLabel('Hỏi gia sư máy chủ', { exact: true }).check();
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('Khối lượng làm đổi chu kỳ không?');
  const reply = page.waitForResponse(response => /\/sessions\/[^/]+\/tutor$/.test(new URL(response.url()).pathname));
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  const result = await (await reply).json();
  expect(result.answer.response_source).toBe('template');
  expect(result.answer.degraded_reason).toBe('LIVE_DISABLED');
  const answer = page.locator('.chat-message.assistant').last();
  await expect(answer).toContainText('Hướng dẫn theo mẫu');
  await expect(answer).toContainText('Preview lượt đã lưu · dữ liệu chưa duyệt');
  await answer.getByText('Preview lượt đã lưu · dữ liệu chưa duyệt').click();
  await expect(answer).toContainText('period_s = ' + result.run.preview.period_s);
});
