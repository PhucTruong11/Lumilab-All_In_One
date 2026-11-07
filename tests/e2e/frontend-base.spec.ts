import { expect, test } from '@playwright/test';

test('Canvas lab and SVG chart run locally even when the API is unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', route => route.abort());
  await page.goto('/#lab/pendulum');
  await expect(page.getByRole('heading', { name: 'Con lắc đơn', exact: true })).toBeVisible();
  await expect(page.getByTestId('pendulum-canvas')).toBeVisible();
  await expect(page.locator('.recharts-surface')).toBeVisible();
  await page.getByRole('button', { name: 'Chạy thí nghiệm' }).click();
  await expect(page.locator('.stage-clock output')).not.toHaveText('0.0');
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  const stopped = await page.locator('.stage-clock output').textContent();
  await page.waitForTimeout(250);
  expect(await page.locator('.stage-clock output').textContent()).toBe(stopped);
  await page.getByRole('button', { name: 'Đặt lại' }).click();
  await expect(page.locator('.stage-clock output')).toHaveText('0.0');
  expect(errors).toEqual([]);
});

test('mass and material do not change the ideal period; zero angle is stationary', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  const period = await page.getByTestId('period-reading').textContent();
  await page.getByRole('slider', { name: 'Khối lượng', exact: true }).press('End');
  await page.getByRole('button', { name: 'Gỗ', exact: true }).click();
  await expect(page.getByTestId('period-reading')).toHaveText(period!);
  await expect(page.getByRole('button', { name: 'Gỗ', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('slider', { name: 'Góc thả', exact: true }).press('Home');
  await expect(page.getByRole('button', { name: 'Chạy thí nghiệm' })).toBeDisabled();
  await expect(page.getByTestId('period-reading')).toContainText('—');
  await page.getByRole('button', { name: 'Ghi số đo' }).click();
  await expect(page.locator('.notebook tbody tr')).toHaveCount(1);
  // The enhanced notebook adds an energy column after the period.
  await expect(page.locator('.notebook tbody tr td').nth(3)).toHaveText('—');
  await expect(page.locator('.notebook tbody tr td').nth(4)).toHaveText('0.000');
});

test('dragging the bob changes length and release angle, with bounded values', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  const canvas = page.getByTestId('pendulum-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  const x = (logical: number) => box.x + logical / 760 * box.width;
  const y = (logical: number) => box.y + logical / 420 * box.height;
  const angle = 35 * Math.PI / 180;
  await page.mouse.move(x(380 + 148 * Math.sin(angle)), y(56 + 148 * Math.cos(angle)));
  await page.mouse.down();
  await page.mouse.move(x(380 + 1.7 * 148), y(56), { steps: 15 });
  await page.mouse.up();
  await expect(page.getByRole('slider', { name: 'Góc thả', exact: true })).toHaveValue('90');
  await expect(page.getByRole('slider', { name: 'Chiều dài dây', exact: true })).toHaveValue('1.7');
  await page.getByRole('button', { name: 'Ghi số đo' }).click();
  await expect(page.locator('.notebook tbody tr')).toContainText('1.70');
});

test('mobile controls and chart fit the viewport and work with keyboard input', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#lab/pendulum');
  const length = page.getByRole('slider', { name: 'Chiều dài dây', exact: true });
  await length.focus();
  await page.keyboard.press('ArrowRight');
  await expect(length).toHaveValue('1.01');
  await expect(page.locator('.recharts-surface')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
