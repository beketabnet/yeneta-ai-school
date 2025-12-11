import { test } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEACHER_EMAIL = 'teacher@yeneta.com';
const TEACHER_PASSWORD = 'password';

test('Debug: Step-by-step login', async ({ page }) => {
  await page.goto(`${BASE_URL}/`);
  await page.screenshot({ path: 'debug-1-landing.png' });
  
  // Click login button
  console.log('Step 1: Looking for login button');
  const loginBtn = page.locator('button, a').filter({ hasText: /^Log in$/ });
  console.log(`Found ${await loginBtn.count()} login buttons`);
  
  if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await loginBtn.click();
    console.log('Clicked login button');
  } else {
    console.log('No login button found, trying alternative');
    // Try any button with login text
    const btns = await page.locator('button, a').all();
    for (let btn of btns) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('log')) {
        console.log(`Found button with text: ${text}`);
        await btn.click();
        break;
      }
    }
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug-2-after-click.png' });
  
  // Check if we're on login page
  const emailField = page.locator('input[name="email"]');
  console.log(`Email field visible: ${await emailField.isVisible().catch(() => false)}`);
  
  if (await emailField.isVisible().catch(() => false)) {
    console.log('Step 2: Filling email');
    await emailField.fill(TEACHER_EMAIL);
    
    console.log('Step 3: Filling password');
    const passwordField = page.locator('input[name="password"]');
    await passwordField.fill(TEACHER_PASSWORD);
    
    await page.screenshot({ path: 'debug-3-form-filled.png' });
    
    console.log('Step 4: Clicking login');
    const submitBtn = page.locator('button:has-text("Log in")');
    console.log(`Submit button visible: ${await submitBtn.isVisible()}`);
    await submitBtn.click();
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'debug-4-after-login.png' });
    
    // Check for errors
    const errorMsg = page.locator('.error, [role="alert"], text=/error|invalid|failed/i');
    const errorVisible = await errorMsg.isVisible().catch(() => false);
    console.log(`Error visible: ${errorVisible}`);
    if (errorVisible) {
      const text = await errorMsg.first().textContent();
      console.log(`Error message: ${text}`);
    }
    
    // Check page content
    const content = await page.content();
    console.log('Page contains "Gradebook":', content.includes('Gradebook'));
    console.log('Page contains "Dashboard":', content.includes('Dashboard'));
  }
});
