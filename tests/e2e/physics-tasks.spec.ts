import { expect, test } from '@playwright/test';

test('a lesson exercise opens its lab with the question still visible', async ({ page }) => {
  await page.goto('/#library');
  await page.getByRole('searchbox', { name: 'Tìm bài học' }).fill('con lắc đơn');
  await page.locator('.search-result').first().click();
  await page.getByRole('button', { name: 'Làm bài này trong thí nghiệm' }).click();
  await expect(page).toHaveURL(/#lab\/pendulum\/pendulum-period$/);
  const panel = page.getByRole('region', { name: 'Bài tập thực hành' });
  await expect(panel.getByText('Con lắc dài 1,00 m', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Con lắc đơn', exact: true })).toBeVisible();
});

test('a physics task link opens the right lab and keeps its instructions beside the simulation', async ({ page }) => {
  await page.goto('/#lab/spring-damped/VL-LOXO-01-A-2');
  const panel = page.getByRole('region', { name: 'Bài tập thực hành' });
  await expect(panel.getByRole('heading', { name: 'So sánh không cản và có cản' })).toBeVisible();
  await expect(panel.getByText('Ghi ca ζ = 0 và ζ = 0,6', { exact: false })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Tỉ số cản' })).toBeVisible();
  await panel.getByRole('button', { name: /Áp dụng ca 2/ }).click();
  await expect(page.getByRole('slider', { name: 'Tỉ số cản' })).toHaveValue('0.6');
  await panel.getByLabel('Chọn bài tập thực hành').selectOption('spring-damped-exercise');
  await expect(page).toHaveURL(/#lab\/spring-damped\/spring-damped-exercise$/);
  await expect(panel.getByText('Khi tỉ số cản ζ = 0,6', { exact: false })).toBeVisible();
  await page.reload();
  await expect(panel.getByLabel('Chọn bài tập thực hành')).toHaveValue('spring-damped-exercise');
  await expect(page.getByRole('slider', { name: 'Tỉ số cản' })).toBeVisible();
});

test('switching labs clears the old task and the task panel works on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#lab/pulley');
  const panel = page.getByRole('region', { name: 'Bài tập thực hành' });
  await panel.getByRole('button', { name: 'Bài tập thực hành' }).click();
  await panel.getByLabel('Chọn bài tập thực hành').selectOption('VL-RONGROC-01-A-1');
  await expect(page.getByRole('region', { name: 'Bài tập thực hành' })).toHaveCount(1);
  await expect(panel.getByRole('heading', { name: 'Đo sự đánh đổi khi đổi nhánh đỡ' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Loại cơ cấu' })).toBeVisible();
  await page.getByLabel('Chuyển bài thực hành').selectOption('pendulum');
  await expect(page).toHaveURL(/#lab\/pendulum$/);
  await expect(panel.getByLabel('Chọn bài tập thực hành')).toHaveCount(0);
  await page.getByRole('region', { name: 'Bài tập thực hành' }).getByRole('button', { name: 'Bài tập thực hành' }).click();
  await expect(page.getByRole('region', { name: 'Bài tập thực hành' }).getByLabel('Chọn bài tập thực hành')).toHaveValue('');
});
