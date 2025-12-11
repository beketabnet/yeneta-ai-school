import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEACHER_EMAIL = 'teacher@yeneta.com';
const TEACHER_PASSWORD = 'password';

async function loginAsTeacher(page: any) {
  await page.goto(`${BASE_URL}/`);
  
  // Click login button
  const loginBtn = page.locator('button, a').filter({ hasText: /^Log in$/ });
  if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginBtn.click();
  }
  
  // Fill login form
  await page.waitForSelector('input[name="email"]', { timeout: 5000 });
  await page.fill('input[name="email"]', TEACHER_EMAIL);
  await page.fill('input[name="password"]', TEACHER_PASSWORD);
  
  // Select teacher role
  const roleSelect = page.locator('select[name="role"]');
  if (await roleSelect.isVisible().catch(() => false)) {
    await roleSelect.selectOption('Teacher');
  }
  
  // Click login button in form
  await page.click('button:has-text("Log in")');
  await page.waitForTimeout(3000);
}

test('Debug: Check dashboard after login', async ({ page }) => {
  await loginAsTeacher(page);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-after-login.png' });
  
  // Log all buttons on the page
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons`);
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    console.log(`Button ${i}: ${text}`);
  }
  
  // Log all navigation-like elements
  const navElements = await page.locator('button, a, [role="tab"], [role="button"]').all();
  console.log(`Found ${navElements.length} navigation elements`);
  for (let i = 0; i < Math.min(navElements.length, 20); i++) {
    try {
      const text = await navElements[i].textContent();
      if (text && text.trim().length > 0) {
        console.log(`Nav ${i}: ${text.trim()}`);
      }
    } catch (e) {
      // Skip
    }
  }
  
  // Check for main content
  const content = await page.content();
  console.log('Page contains "Gradebook":', content.includes('Gradebook'));
  console.log('Page contains "Grades":', content.includes('Grades'));
  console.log('Page contains "Dashboard":', content.includes('Dashboard'));
  console.log('Page contains "Teacher":', content.includes('Teacher'));
});
