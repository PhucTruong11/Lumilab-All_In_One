import { expect, test, type Locator, type Page } from '@playwright/test';

async function dragTo(page: Page, from: Locator, svg: Locator, x: number, y: number, height: number) {
  await from.scrollIntoViewIfNeeded();
  const start = (await from.boundingBox())!;
  const box = (await svg.boundingBox())!;
  // CSS gives the SVG internal padding; use its actual coordinate transform instead.
  const target = await svg.evaluate((element, p) => {
    const point = (element as SVGSVGElement).createSVGPoint(); point.x = p.x; point.y = p.y;
    const screen = point.matrixTransform((element as SVGSVGElement).getScreenCTM()!); return { x: screen.x, y: screen.y };
  }, { x, y, height });
  expect(box.width).toBeGreaterThan(0);
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down(); await page.mouse.move(target.x, target.y, { steps: 15 }); await page.mouse.up();
}

test('titration uses the buret, swaps solutions by dragging and plots the same pH', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#lab/pendulum'); await page.getByRole('combobox', { name: 'Chuyển bài thực hành' }).selectOption('chemistry');
  await expect(page.getByTestId('ph-reading')).toHaveText('1.000');
  await page.getByRole('spinbutton', { name: 'Nhập thể tích bazơ' }).fill('25');
  await expect(page.getByTestId('ph-reading')).toHaveText('7.000');
  await expect(page.getByTestId('indicator-reading')).toHaveText('Không màu');
  await page.getByRole('button', { name: 'Khóa buret: thêm 0,05 mL' }).press('Enter');
  await expect(page.getByTestId('base-volume-reading')).toContainText('25.05');
  await expect(page.getByTestId('indicator-reading')).toHaveText('Hồng');
  await page.getByRole('button', { name: 'Ghi số đo' }).click();
  await expect(page.locator('.notebook tbody')).toContainText('10.000');
  const stage = page.locator('.interactive-stage');
  await dragTo(page, page.getByTestId('bottle-hno3'), stage, 475, 330, 440);
  await expect(page.getByRole('combobox', { name: 'Dung dịch axit' })).toHaveValue('hno3');
  await expect(page.getByTestId('base-volume-reading')).toContainText('0.00');
  await dragTo(page, page.getByTestId('bottle-koh'), stage, 475, 330, 440);
  await expect(page.getByTestId('reaction-equation')).toHaveText('HNO₃ + KOH → KNO₃ + H₂O');
  await expect(page.getByTestId('base-volume-reading')).toContainText('1.00');
  await expect(page.locator('.recharts-reference-dot')).toBeVisible();
  expect(errors).toEqual([]);
});

test('circuit parts fit any slot, swap, switch directly and update source curve/readings', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#lab/pendulum'); await page.getByRole('combobox', { name: 'Chuyển bài thực hành' }).selectOption('circuit');
  const stage = page.locator('.interactive-stage');
  await expect(page.getByTestId('current-reading')).toContainText('0.300');
  await dragTo(page, page.getByTestId('part-extraResistor'), stage, 570, 310, 460);
  await expect(page.getByTestId('total-resistance-reading')).toContainText('40');
  await expect(page.getByTestId('voltage-reading')).toContainText('3.00');
  await dragTo(page, page.getByTestId('part-bulb'), stage, 250, 310, 460);
  await expect(page.getByTestId('current-reading')).toContainText('0.120');
  await dragTo(page, page.getByTestId('part-switchInstalled'), stage, 410, 310, 460);
  await dragTo(page, page.getByTestId('installed-bulb'), stage, 570, 310, 460);
  await page.getByText('Thêm / tháo linh kiện', { exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Vị trí Bóng đèn' })).toHaveValue('2');
  await expect(page.getByRole('combobox', { name: 'Vị trí Điện trở phụ' })).toHaveValue('0');
  await page.getByTestId('installed-switchInstalled').click();
  await expect(page.getByTestId('current-reading')).toContainText('0.000');
  await page.getByRole('button', { name: 'Đóng công tắc' }).click();
  await expect(page.getByTestId('current-reading')).toContainText('0.120');
  await page.getByRole('slider', { name: 'Điện áp trên nguồn', exact: true }).press('End');
  await expect(page.getByTestId('current-reading')).toContainText('0.240');
  await page.getByRole('button', { name: 'Ghi số đo' }).click();
  await expect(page.locator('.notebook tbody')).toContainText('4.80');
  await dragTo(page, page.getByTestId('installed-extraResistor'), stage, 690, 400, 460);
  await expect(page.getByTestId('total-resistance-reading')).toContainText('30');
  await expect(page.locator('.recharts-reference-dot')).toBeVisible();
  expect(errors).toEqual([]);
});

test('series/parallel meter drops never overlap; invalid wiring suppresses readings', async ({ page }) => {
  await page.goto('/#lab/pendulum'); await page.getByRole('combobox', { name: 'Chuyển bài thực hành' }).selectOption('circuit');
  const stage = page.locator('.interactive-stage');
  await dragTo(page, page.getByTestId('meter-voltmeter'), stage, 345, 100, 460);
  await expect(page.getByTestId('current-reading')).toContainText('—');
  await expect(page.getByRole('button', { name: 'Ghi số đo' })).toBeDisabled();
  await dragTo(page, page.getByTestId('meter-voltmeter'), stage, 500, 180, 460);
  await expect(page.getByTestId('current-reading')).toContainText('0.300');
  await dragTo(page, page.getByTestId('meter-ammeter'), stage, 500, 245, 460);
  await expect(page.getByRole('combobox', { name: 'Cách mắc ampe kế' })).toHaveValue('parallel');
  const a = (await page.getByTestId('meter-ammeter').boundingBox())!;
  const v = (await page.getByTestId('meter-voltmeter').boundingBox())!;
  expect(a.y).toBeGreaterThan(v.y + v.height);
  await expect(page.getByTestId('current-reading')).toContainText('—');
  await page.getByRole('combobox', { name: 'Cách mắc ampe kế' }).selectOption('series');
  await expect(page.getByTestId('current-reading')).toContainText('0.300');
});

test('library opens each corresponding new lab', async ({ page }) => {
  await page.goto('/#lab/pendulum'); await page.getByRole('button', { name: 'Thư viện bài học', exact: true }).click();
  await page.getByRole('button', { name: /Hóa học.*Khám phá môn học/ }).click();
  await page.locator('.chapter-card').filter({ has: page.getByRole('heading', { name: 'Dung dịch và axit–bazơ', exact: true }) }).getByRole('button', { name: 'Xem chương' }).click();
  await page.getByRole('button', { name: 'Xem bài học' }).click();
  await page.getByRole('button', { name: 'Mở mô phỏng lưu trữ' }).click();
  await expect(page.getByRole('heading', { name: 'Chuẩn độ axit–bazơ', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thư viện bài học', exact: true }).click();
  await page.getByRole('button', { name: 'Tất cả môn' }).click();
  await page.getByRole('button', { name: /Vật lí.*Khám phá môn học/ }).click();
  await page.locator('.chapter-card').filter({ hasText: 'Dòng điện' }).getByRole('button', { name: 'Xem chương' }).click();
  await page.locator('.lesson-list article').filter({ hasText: 'Mạch điện: mắc đúng' }).getByRole('button', { name: 'Xem bài học' }).click();
  await page.getByRole('button', { name: 'Mở lab mạch điện' }).click();
  await expect(page.getByRole('heading', { name: 'Mạch điện', exact: true })).toBeVisible();
});

test('mobile labs fit, support touch pouring/drag and keyboard alternatives', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#lab/pendulum'); await page.getByRole('combobox', { name: 'Chuyển bài thực hành' }).selectOption('chemistry');
  await page.getByRole('button', { name: '＋ 0,05 mL', exact: true }).tap();
  await expect(page.getByTestId('base-volume-reading')).toContainText('0.05');
  const bottle = (await page.getByTestId('bottle-koh').boundingBox())!;
  const target = await page.locator('.interactive-stage').evaluate(element => { const p = (element as SVGSVGElement).createSVGPoint(); p.x = 475; p.y = 330; const screen = p.matrixTransform((element as SVGSVGElement).getScreenCTM()!); return { x: screen.x, y: screen.y }; });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bottle.x + bottle.width / 2, y: bottle.y + bottle.height / 2 }] });
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bottle.x + bottle.width / 2 + (target.x - bottle.x - bottle.width / 2) * i / 8, y: bottle.y + bottle.height / 2 + (target.y - bottle.y - bottle.height / 2) * i / 8 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByTestId('reaction-equation')).toContainText('KCl');
  await expect(page.getByTestId('base-volume-reading')).toContainText('1.00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('combobox', { name: 'Chuyển bài thực hành' }).selectOption('circuit');
  await page.getByText('Thêm / tháo linh kiện', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Vị trí Bóng đèn' }).selectOption('1');
  await expect(page.getByTestId('current-reading')).toContainText('0.200');
  await page.getByRole('slider', { name: 'Điện trở trên mạch' }).press('End');
  await expect(page.getByTestId('total-resistance-reading')).toContainText('110');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]); await context.close();
});
