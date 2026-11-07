import { expect, test } from '@playwright/test';

test('lab and task filters open rounded menus and remain keyboard usable', async ({ page }) => {
  await page.goto('/#lab/pendulum');
  const lab = page.getByRole('combobox', { name: 'Chuyển bài thực hành' });
  await lab.click();
  const style = await lab.evaluate(select => ({
    pickerRadius: getComputedStyle(select, '::picker(select)').borderTopLeftRadius,
    optionRadius: getComputedStyle(select.querySelector('option')!).borderTopLeftRadius,
  }));
  expect(style).toEqual({ pickerRadius: '14px', optionRadius: '8px' });
  await page.keyboard.press('Escape');
  await lab.selectOption('spring');
  await expect(page).toHaveURL(/#lab\/spring$/);

  const taskButton = page.getByRole('region', { name: 'Bài tập thực hành' }).getByRole('button', { name: 'Bài tập thực hành' });
  await taskButton.click();
  const task = page.getByRole('combobox', { name: 'Chọn bài tập thực hành' });
  await task.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#lab\/spring\/VL-LOXO-01-A-1$/);
});
