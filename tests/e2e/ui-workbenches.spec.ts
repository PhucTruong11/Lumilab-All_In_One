import { expect, test } from '@playwright/test';

for (const id of ['pendulum', 'pulley', 'alkali-water', 'copper-nitric', 'chlorine-bleach']) {
  test(`enhanced workbench fits desktop and mobile without JavaScript errors: ${id}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/#lab/' + id);
    const stage = id === 'pendulum' ? page.getByTestId('pendulum-canvas') : page.locator('.interactive-stage').first();
    await expect(stage).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: info.outputPath(id + '-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(stage).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(id + '-mobile.png'), fullPage: true });
    expect(errors).toEqual([]);
  });
}
