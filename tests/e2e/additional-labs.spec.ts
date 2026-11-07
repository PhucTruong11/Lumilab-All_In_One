import { expect, test, type Locator, type Page } from '@playwright/test';
async function drop(page: Page, from: Locator, x: number, y: number) {
  await from.scrollIntoViewIfNeeded(); const box = (await from.boundingBox())!;
  const target = await page.locator('.interactive-stage').evaluate((element, point) => { const svg = element as SVGSVGElement, p = svg.createSVGPoint(); p.x = point.x; p.y = point.y; const q = p.matrixTransform(svg.getScreenCTM()!); return { x: q.x, y: q.y }; }, { x, y });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(target.x, target.y, { steps: 12 }); await page.mouse.up();
}
test('two-resistor topology changes obey KCL and dragging swaps values', async ({ page }) => {
  await page.goto('/#lab/parallel-circuit');
  const r1 = page.getByRole('slider', { name: 'Điện trở R1', exact: true }); const r2 = page.getByRole('slider', { name: 'Điện trở R2', exact: true });
  await r1.press('Home'); await r2.press('End');
  await drop(page, page.getByTestId('network-r1'), 590, 220);
  await expect(r1).toHaveValue('100'); await expect(r2).toHaveValue('5');
  await page.getByLabel('Kiểu mạng điện', { exact: true }).selectOption('parallel');
  const panel = page.getByRole('region', { name: 'Kết quả tính lại từ máy chủ' });
  const response = page.waitForResponse('**/api/v1/verification/labs/parallel-circuit');
  await panel.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  const result = await (await response).json();
  expect(result.preview.totalCurrent_A).toBeCloseTo(result.preview.branch1Current_A + result.preview.branch2Current_A, 12);
  expect(result.stage_checks.some((item: { stage: string; status: string }) => item.stage === 'physics_invariants' && item.status === 'pass')).toBe(true);
  await expect(page.getByTestId('network-current')).toContainText(result.preview.totalCurrent_A.toFixed(3));
  await page.getByRole('button', { name: 'Mở công tắc', exact: true }).click(); await expect(page.getByTestId('network-current')).toContainText('0.000');
  await expect(page.getByRole('img', { name: 'I (A) theo U (V)' }).locator('.recharts-surface')).toBeVisible();
});
test('RC capacitor drop, running clock and discharge match server voltage', async ({ page }) => {
  await page.goto('/#lab/capacitor');
  const c = page.getByRole('slider', { name: 'Điện dung', exact: true }); const before = Number(await c.inputValue()); expect(before).toBeLessThan(1000);
  await drop(page, page.getByTestId('rc-spare'), 600, 220); await expect(c).toHaveValue(String(Math.min(1000, before + 100)));
  await page.getByLabel('Chế độ tụ điện').selectOption('discharge'); await expect(page.getByTestId('rc-source-bypass')).toHaveAttribute('d', 'M150 195v50');
  await page.getByRole('button', { name: 'Bắt đầu', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Tạm dừng', exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click();
  const response = page.waitForResponse('**/api/v1/verification/labs/capacitor');
  await page.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  const result = await (await response).json();
  expect(result.preview.elapsed_s).toBeGreaterThan(0);
  await expect(page.getByTestId('rc-voltage')).toContainText(result.preview.capacitorVoltage_V.toFixed(3));
  await expect(page.getByRole('img', { name: 'Uc (V) theo t (s)' }).locator('.recharts-surface')).toBeVisible();
});
test('reaction bottles pour only into the reactor, update product and keep preview unreviewed', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const id of ['precipitation', 'gas-reaction']) {
    await page.goto('/#lab/' + id);
    const bottle = page.getByTestId('reaction-bottle-a'); const volume = page.getByRole('slider', { name: id === 'precipitation' ? 'Thể tích AgNO3' : 'Thể tích HCl', exact: true });
    const before = await volume.inputValue(); await drop(page, bottle, 230, 110); await expect(volume).toHaveValue(before);
    await drop(page, bottle, 400, 240); await expect(volume).toHaveValue(String(Math.min(50, Number(before) + 5)));
    const response = page.waitForResponse('**/api/v1/verification/labs/' + id);
    await page.getByRole('button', { name: 'Tính lại trên máy chủ' }).click(); const result = await (await response).json();
    expect(result).toMatchObject({ status: 'INSUFFICIENT_DATA', facts: {}, evidence: [] });
    expect(result.stage_checks.filter((item: { status: string }) => item.status === 'invalid')).toHaveLength(0);
    const key = id === 'precipitation' ? 'precipitateMass_g' : 'carbonDioxideVolume_ml';
    await expect(page.getByTestId(id === 'precipitation' ? 'precipitate-mass' : 'gas-volume')).toContainText(result.preview[key].toFixed(id === 'precipitation' ? 4 : 2));
    await expect(page.getByText('Dữ liệu chưa duyệt', { exact: true }).first()).toBeVisible();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
});
test('Lumi local vector retrieves cited draft content and excludes drafts on request', async ({ page }) => {
  await page.goto('/#lab/precipitation'); await page.getByRole('button', { name: '✦ Lumi', exact: true }).click();
  await page.getByLabel('Tra cứu học liệu có nguồn', { exact: true }).check(); await page.getByLabel('Cách truy xuất', { exact: true }).selectOption('vector');
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('kết tủa AgCl chất giới hạn'); await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  const answer = page.locator('.chat-message.assistant').last();
  await expect(answer).toContainText('Vector băm từ khóa local'); await expect(answer).toContainText('Dữ liệu chưa duyệt');
  await expect(answer.getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
  await page.getByLabel('Cho phép học liệu chưa duyệt', { exact: true }).uncheck();
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('kết tủa AgCl'); await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect(page.locator('.chat-message.assistant').last()).toContainText('Chưa tìm thấy học liệu phù hợp');
});
