import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const labs = ['pendulum', 'chemistry', 'circuit', 'mechanics', 'spring', 'electrochemistry', 'atomic'];

test('all seven labs display and persist real server readings as unreviewed previews', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#lab/pendulum');
  for (const lab of labs) {
    await page.getByLabel('Chuyển bài thực hành').selectOption(lab);
    const panel = page.getByRole('region', { name: 'Kết quả tính lại từ máy chủ' });
    const responsePromise = page.waitForResponse(response =>
      new URL(response.url()).pathname === '/api/v1/verification/labs/' + lab &&
      response.request().method() === 'POST');
    await panel.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    const input = response.request().postDataJSON();
    expect(Object.keys(input).sort()).toEqual(['dataset_version', 'elapsed_s', 'model_version', 'parameters']);
    const body = await response.json();
    expect(body).toMatchObject({
      status: 'INSUFFICIENT_DATA', code: 'REVIEWED_EVIDENCE_REQUIRED', facts: {}, evidence: [],
    });
    await expect(panel.getByText('Dữ liệu chưa duyệt', { exact: true })).toBeVisible();
    await expect(panel.getByText('Bản xem trước từ máy chủ', { exact: true })).toBeVisible();
    await panel.getByText('Các bước kiểm và giới hạn').click();
    await expect(panel).toContainText('Thiếu bằng chứng đã duyệt');
    for (const check of body.stage_checks) {
      await expect(panel).toContainText(check.reason);
    }
    await expect(panel).toContainText('Nguồn tham khảo mô hình (chưa duyệt cho Verify)');
    await panel.getByText('Xem toàn bộ số liệu máy chủ').click();
    const details = panel.getByRole('status', { name: 'Bản xem trước từ máy chủ' }).locator('details').first();
    await expect(details.locator('dt')).toHaveCount(Object.keys(body.preview).length);
    await expect(details.locator('pre')).toHaveCount(0);
    await expect(panel).not.toContainText(/\bVERIFIED\b/);
    await expect(panel.getByText('Lịch sử lượt thử (1/20)')).toBeVisible();
    await page.reload();
    await panel.getByText('Lịch sử lượt thử (1/20)').click();
    const saved = panel.getByRole('listitem');
    await saved.locator('summary').click();
    await expect(saved).toContainText('Dữ liệu chưa duyệt');
    await expect(saved.locator('pre').nth(0)).toHaveText(JSON.stringify(input.parameters, null, 2));
    await expect(saved.locator('dl dt')).toHaveCount(Object.keys(body.preview).length);
    const history = await page.evaluate(id =>
      JSON.parse(localStorage.getItem('lumilab-preview-history-v1-' + id)!), lab);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      ...input, schema_version: 1, lab_id: lab, request_id: body.request_id,
      status: 'INSUFFICIENT_DATA', code: 'REVIEWED_EVIDENCE_REQUIRED',
    });
    if (lab === 'atomic') {
      const download = page.waitForEvent('download');
      await panel.getByRole('button', { name: 'Tải lịch sử JSON' }).click();
      const file = await download;
      expect(file.suggestedFilename()).toBe('LumiLab-atomic-preview-history.json');
      expect(JSON.parse(await readFile((await file.path())!, 'utf-8'))).toEqual(history);
    }
  }
});

test('invalid, unsupported and incomplete science responses do not create preview history', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  const panel = page.getByRole('region', { name: 'Kết quả tính lại từ máy chủ' });
  const path = '**/api/v1/verification/labs/pendulum';
  for (const [status, code, message] of [
    ['INVALID', 'INVALID_MODEL_PARAMETERS', 'không hợp lệ'],
    ['UNSUPPORTED', 'OUTSIDE_MODEL_SCOPE', 'ngoài phạm vi mô hình'],
    ['INSUFFICIENT_DATA', 'SCIENTIFIC_CHECKS_INCOMPLETE', 'chưa hoàn thành các bước kiểm khoa học'],
  ]) {
    await page.route(path, route => route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ status, code, fields: ['angle_deg'], preview: null }) }));
    await panel.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
    await expect(panel.getByRole('alert')).toContainText(message);
    await expect(panel.getByText('Bản xem trước từ máy chủ', { exact: true })).toHaveCount(0);
    await expect(panel.getByText('Lịch sử lượt thử (0/20)')).toBeVisible();
    await page.unroute(path);
  }
});

test('gas reaction shows labeled theoretical readings instead of raw JSON', async ({ page }) => {
  await page.goto('/#lab/gas-reaction');
  const panel = page.getByRole('region', { name: 'Kết quả tính lại từ máy chủ' });
  await panel.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  await panel.getByText('Xem toàn bộ số liệu máy chủ').click();
  const details = panel.getByRole('status', { name: 'Bản xem trước từ máy chủ' }).locator('details').first();
  await expect(details.getByText('Thể tích CO₂ lý thuyết ở 25°C, 1 atm')).toBeVisible();
  await expect(details).not.toContainText('carbonDioxideVolume_ml');
  await expect(details.locator('pre')).toHaveCount(0);
});

test('changing a pendulum parameter marks the server result as an older snapshot', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  const panel = page.getByRole('region', { name: 'Kết quả tính lại từ máy chủ' });
  await panel.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  await expect(panel.getByText('Bản xem trước từ máy chủ', { exact: true })).toBeVisible();
  await page.getByRole('slider', { name: 'Chiều dài dây', exact: true }).press('End');
  await expect(panel).toContainText('Đây là kết quả của lượt đã gửi');
});

test('preview failure can be retried and lab switching clears the old result', async ({ page }) => {
  const path = '**/api/v1/verification/labs/pendulum';
  await page.route(path, route => route.abort());
  await page.goto('/#lab/pendulum');
  const panel = page.getByRole('region', { name: 'Kết quả tính lại từ máy chủ' });
  const button = panel.getByRole('button', { name: 'Tính lại trên máy chủ' });
  await button.click();
  await expect(panel.getByRole('alert')).toContainText('Không kết nối được API');
  await expect(button).toBeEnabled();
  await page.unroute(path);
  await button.click();
  await expect(panel.getByText('Bản xem trước từ máy chủ', { exact: true })).toBeVisible();
  await page.getByLabel('Chuyển bài thực hành').selectOption('chemistry');
  await expect(panel.getByText('Bản xem trước từ máy chủ', { exact: true })).toHaveCount(0);
  await expect(panel.getByText('Dữ liệu chưa duyệt', { exact: true })).toBeVisible();
});


test('a storage failure leaves the server preview visible and reports the unsaved run', async ({ page }) => {
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('lumilab-preview-history-v1-')) throw new DOMException('Full', 'QuotaExceededError');
      return setItem.call(this, key, value);
    };
  });
  await page.goto('/#lab/atomic');
  const panel = page.getByRole('region', { name: 'Kết quả tính lại từ máy chủ' });
  await panel.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  await expect(panel.getByText('Bản xem trước từ máy chủ', { exact: true })).toBeVisible();
  await expect(panel.getByText('Có kết quả xem trước nhưng không lưu được lượt này trên trình duyệt.')).toBeVisible();
  await expect(panel.getByText('Lịch sử lượt thử (0/20)')).toBeVisible();
});
