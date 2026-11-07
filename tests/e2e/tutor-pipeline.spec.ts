import { test, expect } from '@playwright/test';
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
  await page.goto('/#lab/pendulum');
  await page.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  const history = page.getByRole('region', { name: 'Lịch sử theo phiên trên máy chủ' });
  await page.getByText('Lịch sử theo phiên trên máy chủ', { exact: true }).click();
  await history.getByRole('button', { name: 'Lưu lượt này lên máy chủ' }).click();
  await expect(history.getByText('Đã lưu lượt thử theo phiên trên máy chủ.')).toBeVisible();
  await page.getByRole('button', { name: '✦ Lumi', exact: true }).click();
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
  await expect(answer).toContainText('period_s = ' + result.run.preview.period_s);
});
