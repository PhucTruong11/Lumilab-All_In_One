import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('packages/lab-engine/labs/pendulum/lab.json', 'utf8'));

test('damped pendulum settles, stops its clock and can restart after a new release', async ({ page }) => {
  await page.addInitScript(({ model, dataset }) => {
    const painted = window as unknown as { energyBarWidths: number[] };
    painted.energyBarWidths = [];
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const roundRect = CanvasRenderingContext2D.prototype.roundRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.dataset.testid === 'pendulum-canvas') painted.energyBarWidths = [];
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.roundRect = function (...args) {
      if (this.canvas.dataset.testid === 'pendulum-canvas' && args[1] === 44
          && ['#10b981', '#f59e0b'].includes(String(this.fillStyle))) painted.energyBarWidths.push(args[2]);
      return roundRect.apply(this, args);
    };
    localStorage.setItem('lumilab-session-v1-pendulum', JSON.stringify({
      schema_version: 'session-1.0', lab_id: 'pendulum', model_version: model, dataset_version: dataset,
      parameters: { length_m: 1, mass_kg: .2, angle_deg: 35, gravity_m_s2: 9.81 }, elapsed_s: 34.9,
      presentation: { side: 1, material: 'steel' }, notes: { prediction: '', reflection: '' }, records: [],
    }));
  }, { model: config.model_version, dataset: config.dataset_version });
  await page.goto('/#lab/pendulum');
  await page.clock.install();
  await page.getByText('Lực cản môi trường (Tắt dần)', { exact: true }).click();
  const damping = page.getByRole('slider', { name: 'Hệ số lực cản không khí' });
  await damping.fill('.075');
  await page.getByRole('button', { name: 'Chạy thí nghiệm' }).click();
  await page.clock.runFor(1000);
  await expect(page.locator('.mode-chip')).toContainText('Đã tắt dần');
  await expect(page.getByRole('button', { name: 'Chạy thí nghiệm' })).toBeDisabled();
  await expect(page.locator('.readings strong').nth(2)).toHaveText('0.0 °');
  await expect(page.locator('.readings strong').nth(3)).toHaveText('0.00 m/s');
  expect(await page.evaluate(() => (window as unknown as { energyBarWidths: number[] }).energyBarWidths)).toEqual([]);
  const time = await page.locator('.stage-clock output').textContent();
  await page.clock.runFor(3000);
  await expect(page.locator('.stage-clock output')).toHaveText(time!);
  await page.getByRole('slider', { name: 'Góc thả', exact: true }).fill('30');
  await expect(page.getByRole('button', { name: 'Chạy thí nghiệm' })).toBeEnabled();
  await expect(page.locator('.stage-clock output')).toHaveText('0.0');
  await page.getByRole('button', { name: 'Chạy thí nghiệm' }).click();
  await page.clock.runFor(500);
  await expect(page.locator('.mode-chip')).toContainText('Đang dao động');
  expect((await page.evaluate(() => (window as unknown as { energyBarWidths: number[] }).energyBarWidths))
    .reduce((sum, width) => sum + width, 0)).toBeGreaterThan(0);
});
