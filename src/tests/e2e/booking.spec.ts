import { test, expect } from '@playwright/test';

const loginAsDemo = async (page: any, name: string) => {
  await page.goto('/login');
  await page.getByRole('button', { name }).click();
  await expect(page).toHaveURL(/\/booking/);
};

test('booking success and conflict in demo mode', async ({ page }) => {
  await loginAsDemo(page, 'Alice Eng');

  await page.getByLabel('วันที่เริ่มต้น').fill('2026-02-11');
  await page.getByLabel('เวลาเริ่มต้น').fill('09:00');
  await page.getByLabel('วันที่สิ้นสุด').fill('2026-02-11');
  await page.getByLabel('เวลาสิ้นสุด').fill('11:00');
  await page.getByLabel('ที่นั่ง').selectOption('ENG-A1');
  await page.getByRole('button', { name: 'บันทึกการจอง' }).click();

  await expect(page.getByText('บันทึกการจองเรียบร้อย')).toBeVisible();

  await page.getByRole('button', { name: 'บันทึกการจอง' }).click();
  await expect(page.getByText('ที่นั่งถูกจองซ้ำในช่วงเวลาเดียวกัน')).toBeVisible();
});

test('over-capacity is blocked', async ({ page }) => {
  await loginAsDemo(page, 'Ploy Support');

  await page.getByLabel('ฝ่ายงาน').selectOption({ label: 'Support' });
  await page.getByLabel('พนักงาน').selectOption({ label: 'Nok Support' });

  await page.getByLabel('วันที่เริ่มต้น').fill('2026-02-10');
  await page.getByLabel('เวลาเริ่มต้น').fill('10:00');
  await page.getByLabel('วันที่สิ้นสุด').fill('2026-02-10');
  await page.getByLabel('เวลาสิ้นสุด').fill('11:00');

  await page.getByRole('button', { name: 'บันทึกการจอง' }).click();
  await expect(page.getByText('จำนวนที่นั่งเต็มแล้วในช่วงเวลานี้')).toBeVisible();
});
