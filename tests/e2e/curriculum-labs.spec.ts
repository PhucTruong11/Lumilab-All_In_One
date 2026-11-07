import { expect, test } from '@playwright/test';

test('three grouped lessons open both original and extended models', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.practice-card')).toHaveCount(11);
  const pairs = [
    ['spring', 'Con lắc lò xo tắt dần', 'spring-damped'],
    ['mechanics', 'Newton II và mặt phẳng nghiêng', 'inclined-plane'],
    ['parallel-circuit', 'Mạch điện', 'circuit'],
  ];
  for (const [primary, alternative, target] of pairs) {
    await page.getByTestId('practice-card-' + primary).getByText('Vào thực hành').click();
    await page.getByRole('navigation', { name: 'Chế độ thực hành của bài' }).getByRole('button', { name: alternative, exact: true }).click();
    await expect(page).toHaveURL(new RegExp('#lab/' + target + '$'));
    await expect(page.getByRole('heading', { name: alternative, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Danh sách bài thực hành', exact: false }).click();
  }
});

test('pulley controls update the reading and preserve a recorded observation', async ({ page }) => {
  await page.goto('/#lab/pulley');
  await expect(page.getByTestId('pulley-force')).toHaveText(/^49\.05\s*N$/);
  await page.getByRole('button', { name: '3. Pa-lăng (n = 4 nhánh dây)' }).click();
  await expect(page.getByTestId('pulley-force')).toHaveText(/^24\.525\s*N$/);
  await page.getByRole('button', { name: 'Ghi số đo', exact: true }).click();
  await expect(page.locator('.notebook tbody tr')).toContainText('24.525');
  await page.getByRole('button', { name: 'Lưu phiên', exact: true }).click();
  await page.reload();
  await expect(page.locator('.notebook tbody tr')).toContainText('24.525');
});

test('damping changes the running spring and incline friction changes the server preview', async ({ page }) => {
  await page.goto('/#lab/spring-damped');
  await page.getByRole('slider', { name: 'Tỉ số cản' }).press('End');
  const graph = page.getByRole('img', { name: 'Đồ thị li độ lò xo tắt dần theo thời gian' });
  const marker = graph.locator('circle');
  const start = await marker.getAttribute('cx');
  await page.getByRole('button', { name: 'Chạy mô phỏng' }).click();
  await expect(marker).not.toHaveAttribute('cx', start!);
  await page.getByRole('button', { name: 'Tạm dừng' }).click();
  await page.getByRole('button', { name: 'Ghi số đo', exact: true }).click();
  await expect(page.locator('.notebook tbody tr')).toContainText('0.9');

  await page.goto('/#lab/inclined-plane');
  const friction = page.getByRole('slider', { name: 'Hệ số ma sát nghỉ' });
  await friction.press('End');
  await expect(page.getByRole('img', { name: 'Vật trượt trên mặt phẳng nghiêng' })).toContainText('Đứng yên');
  await friction.press('Home');
  await page.getByRole('button', { name: 'Tính lại trên máy chủ' }).click();
  const preview = page.getByRole('status', { name: 'Bản xem trước từ máy chủ' });
  await expect(preview).toContainText('4,905 m/s²');
});

test('chemistry controls compare observation states without carrying an old result forward', async ({ page }) => {
  const observe = () => page.getByRole('button', { name: 'Quan sát', exact: true }).click();
  const observation = page.getByTestId('chem-observation');
  await page.goto('/#lab/alkali-water');
  await observe(); await expect(observation).toHaveText('Bọt khí');
  await page.getByRole('button', { name: '2. Thử màu ngọn lửa đèn khí' }).click();
  await page.getByRole('button', { name: 'Kali (K)', exact: true }).click();
  await expect(observation).toHaveText('—');
  await observe(); await expect(observation).toHaveText('Tím nhạt');

  await page.goto('/#lab/copper-nitric');
  await observe(); await expect(observation).toHaveText('Không màu');
  await page.getByRole('checkbox', { name: /NO gặp không khí/ }).check();
  await observe(); await expect(observation).toHaveText('Có thể chuyển nâu đỏ');
  await page.getByRole('button', { name: '2. Axit HNO₃ đặc', exact: true }).click();
  await observe(); await expect(observation).toHaveText('Nâu đỏ');

  await page.goto('/#lab/chlorine-bleach');
  await observe(); await expect(observation).toHaveText('Không thấy tẩy màu rõ');
  await page.getByRole('button', { name: '1. Giấy màu ẨM (Có nước)', exact: true }).click();
  await observe(); await expect(observation).toHaveText('Giấy màu nhạt rõ');
  await page.getByRole('button', { name: 'Ghi quan sát' }).click();
  await expect(page.locator('.notebook tbody tr')).toContainText('HOCl');
});
