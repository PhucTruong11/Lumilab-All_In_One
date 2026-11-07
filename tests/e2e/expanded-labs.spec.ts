import { expect, test, type Locator, type Page } from '@playwright/test';
async function drag(page: Page, from: Locator, x: number, y: number) {
  await from.scrollIntoViewIfNeeded(); const bounds = (await from.boundingBox())!;
  const target = await page.locator('.interactive-stage').evaluate((svg, point) => { const p = (svg as SVGSVGElement).createSVGPoint(); p.x = point.x; p.y = point.y; const result = p.matrixTransform((svg as SVGSVGElement).getScreenCTM()!); return { x: result.x, y: result.y }; }, { x, y });
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2); await page.mouse.down(); await page.mouse.move(target.x, target.y, { steps: 15 }); await page.mouse.up();
}
test('practice navigation opens the nine-lab catalog with subject and search filters', async ({ page }) => {
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Phòng thực hành', exact: true })).toBeVisible();
  await expect(page.locator('.practice-card')).toHaveCount(11);
  const filter = page.getByRole('group', { name: 'Lọc môn thực hành' });
  await filter.getByRole('button', { name: 'Vật lí', exact: true }).click(); await expect(page.locator('.practice-card')).toHaveCount(6);
  await filter.getByRole('button', { name: 'Hóa học', exact: true }).click(); await expect(page.locator('.practice-card')).toHaveCount(5);
  await filter.getByRole('button', { name: 'Tất cả', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Tìm bài thực hành' }).fill('lo xo'); await expect(page.locator('.practice-card')).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Tìm bài thực hành' }).fill('xyz không có'); await expect(page.getByText('Chưa tìm thấy bài phù hợp')).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await page.getByRole('button', { name: 'Mở bài thực hành Định luật II Newton', exact: true }).click();
  await page.getByRole('button', { name: 'Phòng thực hành', exact: true }).click(); await expect(page.locator('.practice-card')).toHaveCount(11);
});

test('every lesson includes theory, formulas, exercise and the corresponding working lab', async ({ page }) => {
  const labs = [["pendulum", "Con lắc đơn"], ["spring", "Con lắc lò xo"], ["mechanics", "Định luật II Newton"], ["pulley", "Ròng rọc và pa-lăng"], ["parallel-circuit", "Mạch nối tiếp và song song"], ["capacitor", "Tụ điện: nạp và phóng điện"], ["chemistry", "Chuẩn độ axit–bazơ"], ["precipitation", "Phản ứng tạo kết tủa AgCl"], ["gas-reaction", "Phản ứng axit và muối bicarbonat"], ["electrochemistry", "Pin điện hóa"], ["atomic", "Cấu tạo nguyên tử"]];
  await page.goto('/');
  for (const [id, title] of labs) {
    await page.getByTestId(`practice-card-${id}`).getByRole('button', { name: 'Xem bài học', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Kiến thức nền', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Công thức cần nhớ', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thử vận dụng', exact: true })).toBeVisible();
    await expect(page.getByLabel('Ghi chú của bạn', { exact: true })).toBeVisible();
    if (['pulley', 'precipitation', 'gas-reaction', 'electrochemistry', 'atomic'].includes(id)) {
      await page.getByText('Thực hành có hướng dẫn', { exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Tiêu chí tự đánh giá' })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Thực hành ngay', exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeInViewport();
    await expect(page.locator('.stage-panel')).toBeVisible();
    await page.getByRole('button', { name: 'Danh sách bài thực hành', exact: false }).click();
  }
});

test('Newton force/cart weights update acceleration, motion graph and recorded values', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#lab/mechanics');
  await expect(page.getByTestId('newton-acceleration')).toContainText('1.00');
  await drag(page, page.getByTestId('newton-force'), 470, 170);
  await expect(page.getByRole('slider', { name: 'Hợp lực', exact: true })).toHaveValue('6');
  await expect(page.getByTestId('newton-acceleration')).toContainText('3.00');
  await drag(page, page.getByTestId('newton-mass'), 380, 240);
  await expect(page.getByTestId('newton-acceleration')).toContainText('2.40');
  await page.getByRole('button', { name: 'Chạy thí nghiệm', exact: false }).click();
  await expect(page.getByTestId('newton-velocity')).not.toContainText('0.00');
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click();
  await page.getByRole('button', { name: 'Ghi số đo', exact: false }).click(); await expect(page.locator('.notebook tbody tr')).toContainText('2.40');
  await expect(page.getByRole('img', { name: 'Đồ thị vận tốc theo thời gian', exact: true }).locator('.recharts-surface')).toBeVisible();
  expect(errors).toEqual([]);
});

test('spring bob drag, mass, graph, zero release and persistence use the shared engine', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#lab/spring'); await expect(page.getByTestId('spring-period')).toContainText('0.993');
  await drag(page, page.getByTestId('spring-bob'), 550, 230);
  await expect(page.getByRole('slider', { name: 'Li độ thả', exact: true })).toHaveValue('0.3');
  await page.getByRole('slider', { name: 'Khối lượng vật', exact: true }).press('End'); await expect(page.getByTestId('spring-period')).toContainText('1.987');
  await page.getByRole('button', { name: 'Thả vật', exact: false }).click(); await expect(page.getByTestId('spring-displacement')).not.toContainText('0.300');
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click(); await page.getByRole('button', { name: 'Ghi số đo', exact: false }).click();
  await page.reload(); await expect(page.locator('.notebook tbody tr')).toHaveCount(1);
  await expect(page.getByRole('img', { name: 'Đồ thị li độ lò xo theo thời gian', exact: true }).locator('.recharts-surface')).toBeVisible();
  // Use keyboard to select exact zero without depending on browser range-event internals.
  const release = page.getByRole('slider', { name: 'Li độ thả', exact: true }); await release.press('Home'); await release.press('ArrowRight', { delay: 1 });
  for (let i = 0; i < 39; i++) await release.press('ArrowRight');
  await expect(release).toHaveValue('0'); await expect(page.getByRole('button', { name: 'Thả vật', exact: false })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('electrode drops, cell polarity and salt bridge affect meter and comparison chart', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/#lab/electrochemistry'); await expect(page.getByTestId('cell-voltage')).toContainText('1.10');
  await drag(page, page.getByTestId('electrode-ag'), 210, 225); await expect(page.getByRole('combobox', { name: 'Điện cực trái', exact: true })).toHaveValue('ag');
  await expect(page.getByTestId('cell-voltage')).toContainText('-0.46'); await expect(page.getByTestId('cell-reaction')).toHaveText('Cu + 2Ag⁺ → Cu²⁺ + 2Ag');
  await page.getByRole('button', { name: 'Tháo cầu muối', exact: true }).click(); await expect(page.getByTestId('cell-voltage')).toContainText('—'); await expect(page.getByTestId('cell-emf')).toContainText('0.46');
  await page.getByRole('button', { name: 'Nối cầu muối', exact: true }).click();
  await page.getByRole('combobox', { name: 'Điện cực phải', exact: true }).selectOption('ag'); await expect(page.getByTestId('cell-emf')).toContainText('0.00');
  await expect(page.getByRole('img', { name: 'So sánh điện áp phải trừ trái theo điện cực phải' }).locator('.recharts-surface')).toBeVisible();
  expect(errors).toEqual([]);
});

test('atomic particle drops update identity/charge/count bars and lesson links on mobile', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/#lab/atomic');
  await expect(page.getByTestId('atomic-charge')).toHaveText('0');
  await drag(page, page.getByTestId('particle-neutrons'), 400, 210); await expect(page.getByTestId('atomic-mass')).toHaveText('24');
  await drag(page, page.getByTestId('particle-electrons'), 500, 210); await expect(page.getByTestId('atomic-charge')).toHaveText('-1');
  await page.getByRole('button', { name: 'Cân bằng electron', exact: true }).click(); await expect(page.getByTestId('atomic-charge')).toHaveText('0');
  await page.getByRole('slider', { name: 'Số proton', exact: true }).press('ArrowRight'); await expect(page.getByTestId('atomic-number')).toHaveText('12');
  await expect(page.getByRole('img', { name: 'Biểu đồ số proton neutron electron' }).locator('.recharts-surface')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); expect(errors).toEqual([]);
});
