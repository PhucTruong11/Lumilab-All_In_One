import { expect, test } from '@playwright/test';

test('Lumi retrieves local passages with sources and review labels for every sample lab', async ({ page }) => {
  await page.goto('/#lumi');
  await page.getByLabel('Tra cứu học liệu có nguồn', { exact: true }).check();
  const queries = {
    pendulum: 'khối lượng và chu kỳ', chemistry: 'pH tương đương', circuit: 'ampe kế mắc',
    mechanics: 'hợp lực gia tốc', spring: 'chu kỳ lò xo',
    'parallel-circuit': 'dòng nhánh song song', capacitor: 'nạp xả tụ điện',
    precipitation: 'kết tủa AgCl', 'gas-reaction': 'bicarbonat CO2',
  };
  for (const [id, query] of Object.entries(queries)) {
    await page.getByLabel('Bài đang hỏi', { exact: true }).selectOption(id);
    await page.getByLabel('Hỏi Lumi', { exact: true }).fill(query);
    await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
    const answer = page.locator('.chat-message.assistant').last();
    await expect(answer).toContainText('Dữ liệu chưa duyệt');
    await expect(answer.getByRole('link').first()).toHaveAttribute('href', /^https:\/\//);
    await expect(answer).toContainText('Mã đoạn ' + id + '-overview');
    await expect(answer).not.toContainText('VERIFIED');
  }
  await page.getByLabel('Cho phép học liệu chưa duyệt', { exact: true }).uncheck();
  await page.getByLabel('Hỏi Lumi', { exact: true }).fill('CO2');
  await page.getByRole('button', { name: 'Gửi câu hỏi' }).click();
  await expect(page.locator('.chat-message.assistant').last()).toContainText('Chưa tìm thấy học liệu phù hợp');
});
