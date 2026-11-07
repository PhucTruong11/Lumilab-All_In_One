import { expect, test } from '@playwright/test';

const active = ['pendulum', 'spring', 'spring-damped', 'mechanics', 'inclined-plane', 'pulley', 'circuit', 'parallel-circuit', 'capacitor', 'alkali-water', 'copper-nitric', 'chlorine-bleach'];
const chemistry = ['alkali-water', 'copper-nitric', 'chlorine-bleach'];

for (const id of active) {
  test(`configurations retain notebook and fit a phone: ${id}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/#lab/' + id);
    await page.waitForLoadState('networkidle');
    await page.locator('.experiment-presets summary').click();
    const presets = page.locator('.experiment-preset-list button');
    await expect(presets).toHaveCount(3);
    await presets.first().click();
    await expect(presets.first()).toHaveAttribute('aria-pressed', 'true');
    if (chemistry.includes(id)) await page.getByRole('button', { name: 'Mở quan sát trên bàn', exact: true }).click();
    await page.locator('.stage-actions .record-button').click();
    await expect(page.locator('.notebook tbody tr')).toHaveCount(1);
    await presets.last().click();
    await expect(page.locator('.notebook tbody tr')).toHaveCount(1);
    await expect(presets.last()).toHaveAttribute('aria-pressed', 'true');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('precise input validates bounds, supports Escape and shares state with the slider', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  const input = page.getByRole('spinbutton', { name: 'Chiều dài dây chính xác', exact: true });
  const slider = page.getByRole('slider', { name: 'Chiều dài dây', exact: true });
  await input.fill('1.25'); await input.press('Enter');
  await expect(slider).toHaveValue('1.25');
  await input.fill('9'); await input.press('Enter');
  await page.locator('.experiment-presets summary').click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(slider).toHaveValue('1.25');
  await input.press('Escape'); await expect(input).toHaveValue('1.25');
  await slider.focus(); await slider.press('ArrowRight');
  await expect(input).toHaveValue('1.26');
  await page.getByTestId('pendulum-canvas').focus(); await page.keyboard.press('ArrowUp');
  await expect(input).toHaveValue('1.27');
  await input.fill('9'); await input.press('Enter');
  await page.getByRole('button', { name: 'Dây dài', exact: false }).click();
  await expect(input).toHaveValue('2');
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
});

test('particle counts reject fractions without breaking the archived lab', async ({ page }) => {
  await page.goto('/#lab/atomic');
  const input = page.getByRole('spinbutton', { name: 'Số proton chính xác' });
  const before = await page.getByRole('slider', { name: 'Số proton', exact: true }).inputValue();
  await input.fill('12.5'); await input.press('Enter');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('slider', { name: 'Số proton', exact: true })).toHaveValue(before);
  await input.press('Escape');
  await expect(page.locator('.stage-panel')).toBeVisible();
});

test('manual time step, speed change during playback and rewind keep the current configuration', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  const clock = page.getByLabel('Đồng hồ thực hành', { exact: true });
  await page.getByRole('button', { name: 'Tiến 0,1 s', exact: true }).click();
  await expect(clock).toHaveText('0.10 s');
  await page.getByRole('button', { name: 'Chạy thí nghiệm', exact: false }).click();
  await page.getByLabel('Tốc độ mô phỏng', { exact: true }).selectOption('2');
  await expect(page.locator('.experiment-status strong')).toHaveText('Đang chạy');
  await expect.poll(async () => Number((await clock.textContent())!.split(' ')[0])).toBeGreaterThan(.3);
  await page.getByRole('button', { name: 'Tạm dừng', exact: false }).click();
  await page.getByRole('button', { name: 'Về t = 0', exact: true }).click();
  await expect(clock).toHaveText('0.00 s');
  await expect(page.getByRole('spinbutton', { name: 'Chiều dài dây chính xác' })).toHaveValue('1');
});

test('focus view preserves configuration and records when reopened', async ({ page }) => {
  await page.goto('/#lab/spring');
  await page.getByRole('spinbutton', { name: 'Độ cứng lò xo chính xác' }).fill('45');
  await page.getByRole('spinbutton', { name: 'Độ cứng lò xo chính xác' }).press('Enter');
  await page.locator('.stage-actions .record-button').click();
  await page.getByRole('button', { name: 'Tập trung', exact: true }).click();
  await expect(page.locator('.notebook')).toBeHidden();
  await expect(page.locator('.parameter-panel')).toBeVisible();
  await page.getByRole('button', { name: 'Hiện đầy đủ', exact: true }).click();
  await expect(page.locator('.notebook tbody tr')).toHaveCount(1);
  await expect(page.getByRole('spinbutton', { name: 'Độ cứng lò xo chính xác' })).toHaveValue('45');
});

test('pulley load supports real dragging and keyboard changes', async ({ page }) => {
  await page.goto('/#lab/pulley');
  const load = page.getByTestId('pulley-load');
  await load.focus(); await load.press('ArrowUp');
  const input = page.getByRole('spinbutton', { name: 'Độ cao cần nâng h chính xác' });
  await expect(input).toHaveValue('1.05');
  const box = (await load.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 30, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => Number(await input.inputValue())).toBeGreaterThan(1.05);
});

test('incline handle supports dragging and keyboard changes', async ({ page }) => {
  await page.goto('/#lab/inclined-plane');
  const handle = page.getByTestId('incline-angle-handle');
  await handle.focus(); await handle.press('ArrowUp');
  const input = page.getByRole('spinbutton', { name: 'Góc nghiêng chính xác' });
  await expect(input).toHaveValue('31');
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 35, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => Number(await input.inputValue())).toBeGreaterThan(31);
});

test('chemical stage observation and paper control work from the keyboard', async ({ page }) => {
  await page.goto('/#lab/chlorine-bleach');
  const observe = page.getByRole('button', { name: 'Mở quan sát trên bàn', exact: true });
  await observe.focus(); await observe.press('Enter');
  await expect(page.locator('.stage-actions .record-button')).toBeEnabled();
  const paper = page.getByRole('button', { name: 'Đổi giấy khô hoặc ẩm', exact: true });
  await paper.focus(); await paper.press('Space');
  await expect(page.locator('.stage-actions .record-button')).toBeDisabled();
  await observe.focus(); await observe.press('Enter');
  await expect(page.getByTestId('chem-observation')).not.toHaveText('—');
});

test('mobile starts with compact presets and can open them', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#lab/pendulum');
  await expect(page.locator('.experiment-preset-list')).toBeHidden();
  await page.locator('.experiment-presets summary').click();
  await expect(page.locator('.experiment-preset-list')).toBeVisible();
});

test('damped spring block and pulley dynamometer support real dragging and keyboard changes', async ({ page }) => {
  await page.goto('/#lab/spring-damped');
  const bob = page.getByTestId('damped-spring-bob');
  const dispInput = page.getByRole('spinbutton', { name: 'Li độ thả chính xác' });
  const initialDisp = Number(await dispInput.inputValue());
  await bob.focus(); await bob.press('ArrowRight');
  await expect(dispInput).toHaveValue(String(Number((initialDisp + 0.02).toFixed(2))));
  const bobBox = (await bob.boundingBox())!;
  await page.mouse.move(bobBox.x + bobBox.width / 2, bobBox.y + bobBox.height / 2);
  await page.mouse.down(); await page.mouse.move(bobBox.x + bobBox.width / 2 - 70, bobBox.y + bobBox.height / 2, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => Number(await dispInput.inputValue())).toBeLessThan(initialDisp);

  await page.goto('/#lab/pulley');
  const dyno = page.getByTestId('pulley-dynamometer');
  const liftInput = page.getByRole('spinbutton', { name: 'Độ cao cần nâng h chính xác' });
  await dyno.focus(); await dyno.press('ArrowDown');
  await expect(liftInput).toHaveValue('1.05');
  const dynoBox = (await dyno.boundingBox())!;
  await page.mouse.move(dynoBox.x + dynoBox.width / 2, dynoBox.y + dynoBox.height / 2);
  await page.mouse.down(); await page.mouse.move(dynoBox.x + dynoBox.width / 2, dynoBox.y + dynoBox.height / 2 + 35, { steps: 8 }); await page.mouse.up();
  await expect.poll(async () => Number(await liftInput.inputValue())).toBeGreaterThan(1.05);
});

test('on-stage chemistry apparatus and inquiry prompts guide interactive discovery', async ({ page }) => {
  await page.goto('/#lab/alkali-water');
  await page.locator('.experiment-presets summary').click();
  await page.locator('.experiment-preset-list button').first().click();
  await expect(page.locator('.scenario-prompt')).toContainText('Câu hỏi khám phá:');
  await page.getByRole('button', { name: 'Chọn mẫu K trên bàn', exact: true }).click();
  await page.getByRole('button', { name: 'Thả mẩu kim loại vào chậu nước', exact: true }).click();
  await expect(page.getByTestId('chem-observation')).toHaveText('Bọt khí');
  await expect(page.locator('.inquiry-steps span').nth(1)).toHaveClass(/is-done/);

  await page.goto('/#lab/copper-nitric');
  await page.getByRole('button', { name: 'Đóng mở tiếp xúc không khí ở miệng ống', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: /NO gặp không khí/ })).toBeChecked();
  await page.getByRole('button', { name: 'Mở quan sát trên bàn', exact: true }).click();
  await expect(page.getByTestId('chem-observation')).toHaveText('Có thể chuyển nâu đỏ');

  await page.goto('/#lab/chlorine-bleach');
  await page.getByRole('button', { name: 'Đổi giấy khô hoặc ẩm', exact: true }).click();
  await page.getByRole('button', { name: 'Khóa phễu nhỏ giọt HCl', exact: true }).click();
  await expect(page.getByTestId('chem-observation')).toHaveText('Giấy màu nhạt rõ');
});
