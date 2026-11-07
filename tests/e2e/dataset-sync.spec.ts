import { expect, test } from '@playwright/test';

test('archived lab lessons are searchable, linked and included in the chapter quiz', async ({ page }) => {
  await page.goto('/#library');
  await expect(page.getByText('2 môn · 15 chương mẫu')).toBeVisible();
  const search = page.getByRole('searchbox', { name: 'Tìm bài học' });
  await search.fill('ben trong mot nguyen tu');
  await page.getByRole('button', { name: /Bên trong một nguyên tử/ }).click();
  await page.getByRole('textbox', { name: 'Đáp án (neutron)' }).fill('12');
  await page.getByRole('button', { name: 'Kiểm tra', exact: true }).click();
  await expect(page.getByText('Đúng rồi!', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Gợi ý & lời giải' }).click();
  await expect(page.getByText('N = 23 − 11 = 12 neutron.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mở mô phỏng lưu trữ' }).click();
  await expect(page).toHaveURL(/#lab\/atomic$/);
  await page.getByText('Dự đoán & giải thích', { exact: true }).click();
  await page.getByRole('button', { name: 'Kiến thức & bài tập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bên trong một nguyên tử' })).toBeVisible();

  await page.getByRole('button', { name: 'Không gian học tập', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo quiz', exact: true }).click();
  await page.getByRole('combobox', { name: 'Môn học' }).selectOption('chemistry');
  await page.getByRole('combobox', { name: 'Chương' }).selectOption('electrochemistry');
  await expect(page.getByRole('combobox', { name: 'Chương' }).locator('option[value="organic"]')).toHaveCount(0);
  await expect(page.getByText('1 câu phù hợp.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo bộ quiz' }).click();
  await page.getByRole('radio', { name: /Nhường electron/ }).check();
  await page.getByRole('button', { name: 'Xem kết quả & giải thích' }).click();
  await expect(page.getByText('Đáp án B: Oxi hóa là quá trình nhường electron.')).toBeVisible();
  await expect(page.getByText('Đúng 1/1 câu.', { exact: false })).toBeVisible();
});

test('a source chapter roadmap without a lesson and a source lab activity display original content', async ({ page }) => {
  await page.goto('/#library');
  const search = page.getByRole('searchbox', { name: 'Tìm bài học' });
  await search.fill('bước sóng');
  await page.getByRole('button', { name: 'Sóng Lộ trình chương' }).click();
  await expect(page.getByRole('heading', { name: 'Lộ trình · Sóng' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Lộ trình chương' }).getByRole('listitem')).toHaveCount(3);
  await expect(page.getByText('Chưa có bài học, bài tập có đáp án hoặc mô phỏng riêng', { exact: false })).toBeVisible();

  await search.fill('chuẩn độ');
  await page.getByRole('region', { name: 'Kết quả tìm kiếm' }).getByRole('button', { name: /Kiến thức & bài tập/ }).first().click();
  await page.getByText('Kịch bản thực hành gốc · Chuẩn độ axit–bazơ', { exact: true }).click();
  await expect(page.getByText('Ghi thể tích, pH, màu chỉ thị tại 24,95; 25,00 và 25,05 mL NaOH.', { exact: true })).toBeVisible();
  const question = page.getByRole('group', { name: 'Tại điểm tương đương của HCl và NaOH, phenolphthalein có màu gì?' });
  await question.getByText('Xem đáp án').click();
  await expect(question.locator('details p')).toHaveText('Không màu');
});
