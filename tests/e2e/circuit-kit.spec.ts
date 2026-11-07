import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const lab = JSON.parse(readFileSync(resolve('packages/lab-engine/labs/circuit/lab.json'), 'utf8'));

test('circuit kit supports repeated bulbs, a 10 Ω resistor and an old saved session', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#lab/circuit');
  const slot1 = page.getByRole('combobox', { name: 'Linh kiện ô 1' });
  const slot2 = page.getByRole('combobox', { name: 'Linh kiện ô 2' });
  const slot3 = page.getByRole('combobox', { name: 'Linh kiện ô 3' });

  await slot1.selectOption('bulb');
  await slot2.selectOption('bulb');
  await expect(page.getByTestId('installed-bulb')).toHaveCount(2);
  await expect(page.getByTestId('current-reading')).toContainText('0.150');
  await expect(page.getByTestId('total-resistance-reading')).toContainText('40');
  await page.getByRole('button', { name: 'Ghi số đo' }).click();
  await expect(page.locator('.notebook tbody tr')).toHaveCount(1);

  const response = await page.request.post('/api/v1/verification/labs/circuit', { data: {
    model_version: lab.model_version, dataset_version: lab.dataset_version,
    parameters: { ...lab.defaults, slots: ['bulb', 'bulb', null] }, elapsed_s: 0,
  } });
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.preview.current_A).toBeCloseTo(0.15);
  expect(result.preview.bulbPower_W).toBeCloseTo(0.45);
  expect(result.stage_checks.find((check: { stage: string }) => check.stage === 'physics_invariants').status).toBe('pass');

  await slot3.selectOption('resistor10');
  await expect(page.getByTestId('total-resistance-reading')).toContainText('50');
  await expect(page.getByTestId('current-reading')).toContainText('0.120');
  await expect(page.locator('.notebook tbody tr')).toHaveCount(1);

  const oldSession = {
    schema_version: 'session-1.0', lab_id: 'circuit', model_version: 'ideal-series-circuit-ts-v1',
    dataset_version: lab.dataset_version, parameters: { ...lab.defaults, slots: ['extraResistor', 'bulb', null] },
    elapsed_s: 0, presentation: { side: 1, material: 'steel' },
    notes: { prediction: '', reflection: '' }, records: [],
  };
  await page.locator('input[aria-label="Tệp phiên thí nghiệm"]').setInputFiles({
    name: 'mach-cu.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(oldSession)),
  });
  await expect(page.getByTestId('total-resistance-reading')).toContainText('50');
  await expect(page.getByTestId('current-reading')).toContainText('0.120');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất phiên' }).click();
  const exported = JSON.parse(readFileSync(await (await download).path()!, 'utf8').replace(/^\uFEFF/, ''));
  expect(exported.model_version).toBe('ideal-series-circuit-ts-v2');
  expect(errors).toEqual([]);
});

test('mobile circuit keeps the stage early and allows keyboard assembly of repeated parts', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('/#lab/circuit');
  await expect(page.getByTestId('part-bulb')).toBeVisible();
  const stage = await page.locator('.interactive-stage').boundingBox();
  expect(stage?.y).toBeLessThan(550);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);

  await page.getByTestId('part-bulb').press('Enter');
  await page.getByTestId('circuit-slot-0').press('Enter');
  await page.getByTestId('part-bulb').press('Enter');
  await page.getByTestId('circuit-slot-1').press('Enter');
  await expect(page.getByTestId('installed-bulb')).toHaveCount(2);
  await page.getByTestId('installed-bulb').first().press('Enter');
  await page.getByTestId('circuit-slot-2').press('Enter');
  await expect(page.getByTestId('circuit-slot-0')).toBeVisible();
  await page.getByTestId('installed-bulb').first().press('Enter');
  await page.getByTestId('remove-component-target').press('Enter');
  await expect(page.getByTestId('installed-bulb')).toHaveCount(1);
  await page.close();
});
