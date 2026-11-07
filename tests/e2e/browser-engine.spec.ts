import { expect, test } from '@playwright/test';

test('a failed chart module does not take down the experiment or its controls', async ({ page }) => {
  await page.route('**/*PendulumChart*', route => route.abort());
  await page.goto('/#lab/pendulum');
  await expect(page.getByText('Chưa mở được đồ thị.', { exact: false })).toBeVisible();
  await page.getByRole('slider', { name: 'Chiều dài dây', exact: true }).press('End');
  await expect(page.getByRole('slider', { name: 'Chiều dài dây', exact: true })).toHaveValue('2');
  await expect(page.getByTestId('period-reading')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu phiên', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu phiên' })).toBeVisible();
});

test('engine keeps all three sessions when switching labs and restores a saved session on reload', async ({ page }) => {
  await page.goto('/#lab/chemistry');
  await page.getByRole('spinbutton', { name: 'Nhập thể tích bazơ' }).fill('25.05');
  await page.getByRole('button', { name: 'Ghi số đo', exact: false }).click();
  await page.getByText('Dự đoán & giải thích', { exact: true }).click();
  await page.getByLabel('Trước khi thử, bạn dự đoán gì?').fill('Sau tương đương chỉ thị sẽ hồng.');
  await page.getByRole('button', { name: 'Lưu phiên', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu phiên' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Chuyển bài thực hành' }).selectOption('circuit');
  await page.getByRole('slider', { name: 'Điện áp nguồn', exact: true }).press('End');
  await page.getByRole('combobox', { name: 'Chuyển bài thực hành' }).selectOption('chemistry');
  await expect(page.getByTestId('ph-reading')).toHaveText('10.000');
  await expect(page.locator('.notebook tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Thư viện bài học', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Tìm bài học' }).fill('chuẩn độ');
  await page.locator('.search-result').first().click();
  await page.getByRole('button', { name: 'Mở lab chuẩn độ', exact: true }).click();
  await expect(page.getByTestId('base-volume-reading')).toContainText('25.05');
  await page.reload();
  await expect(page.getByTestId('base-volume-reading')).toContainText('25.05');
  await expect(page.locator('.notebook tbody tr')).toHaveCount(1);
  await page.getByText('Dự đoán & giải thích', { exact: true }).click();
  await expect(page.getByLabel('Trước khi thử, bạn dự đoán gì?')).toHaveValue('Sau tương đương chỉ thị sẽ hồng.');
});

test('invalid imports and blocked storage keep the current lab; valid JSON export can be restored', async ({ page }) => {
  await page.goto('/#lab/circuit');
  await page.getByRole('slider', { name: 'Điện áp nguồn', exact: true }).press('End');
  await page.getByLabel('Tệp phiên thí nghiệm').setInputFiles({ name: 'wrong.json', mimeType: 'application/json', buffer: Buffer.from('{"lab_id":"fake","reading":{"current_A":999}}') });
  await expect(page.getByRole('status').filter({ hasText: 'Tệp không hợp lệ' })).toBeVisible();
  await expect(page.getByTestId('current-reading')).toContainText('0.600');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất phiên', exact: true }).click();
  const download = await downloadEvent; const path = (await download.path())!;
  await page.getByRole('button', { name: 'Đặt lại', exact: false }).click();
  await page.getByLabel('Tệp phiên thí nghiệm').setInputFiles(path);
  await expect(page.getByTestId('current-reading')).toContainText('0.600');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'QuotaExceededError'); }; });
  await page.getByRole('button', { name: 'Lưu phiên', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Không thực hiện được' })).toBeVisible();
  await expect(page.getByTestId('current-reading')).toContainText('0.600');
});

test('leaving the pendulum pauses time and Lumi explains actual engine facts', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  await page.getByRole('button', { name: 'Chạy thí nghiệm', exact: false }).click();
  await expect(page.locator('.stage-clock output')).not.toHaveText('0.0');
  await page.getByRole('button', { name: '✦ Lumi', exact: true }).click();
  await page.getByRole('combobox', { name: 'Chế độ Lumi' }).selectOption('explain');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('Giải thích lượt thử hiện tại');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect(page.locator('.chat-message.assistant').last()).toContainText('góc thả = 35°');
  await expect(page.locator('.chat-message.assistant').last()).toContainText('Số đo từ lượt thử');
  await page.getByRole('button', { name: 'Phòng thực hành', exact: true }).click();
  await page.getByRole('button', { name: 'Mở bài thực hành Con lắc đơn', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chạy thí nghiệm', exact: false })).toBeVisible();
  const time = await page.locator('.stage-clock output').textContent();
  await page.waitForTimeout(200); await expect(page.locator('.stage-clock output')).toHaveText(time!);
  await page.getByText('Dự đoán & giải thích', { exact: true }).click();
  await page.getByRole('button', { name: 'Kiến thức & bài tập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Kiến thức nền', exact: true })).toBeVisible();
});

test('library search has empty/results states; activity draft import and quiz retry work', async ({ page }) => {
  await page.goto('/#library');
  await page.getByRole('searchbox', { name: 'Tìm bài học' }).fill('không tồn tại xyz');
  await expect(page.getByText('Chưa có bài phù hợp.', { exact: false })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Tìm bài học' }).fill('chuẩn độ');
  await page.locator('.search-result').first().click();
  await expect(page.getByRole('button', { name: 'Mở lab chuẩn độ', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Không gian học tập', exact: true }).click();
  await page.getByLabel('Tệp bản nháp hoạt động').setInputFiles({ name: 'activity.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ title: 'Thử nghiệm axit', goal: 'So sánh pH trước và sau tương đương.', lessonId: 'chemistry', minutes: 15, notes: '' })) });
  await expect(page.getByLabel('Tên hoạt động', { exact: true })).toHaveValue('Thử nghiệm axit');
  await page.getByRole('button', { name: 'Mở lab của hoạt động' }).click();
  await expect(page.getByTestId('ph-reading')).toBeVisible();
  await page.getByRole('button', { name: 'Không gian học tập', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo quiz', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo bộ quiz', exact: true }).click();
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Xem kết quả & giải thích' }).click();
  await page.getByRole('button', { name: 'Làm lại', exact: true }).click();
  await expect(page.getByRole('radio').first()).not.toBeChecked();
  await expect(page.getByText('Đã trả lời 0/4')).toBeVisible();
});
