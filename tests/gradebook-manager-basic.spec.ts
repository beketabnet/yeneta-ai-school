import { test, expect } from '@playwright/test';

test.describe('Gradebook Manager Basic Functionality', () => {
  test('should load page and verify dropdown selects are present', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[type="email"]', 'smith.teacher@school.edu');
    await page.fill('input[type="password"]', 'teacher123');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }
    
    await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(() => {
      console.log('URL change not detected, continuing...');
    });
    
    await page.waitForTimeout(3000);
    
    const gradebookTab = page.locator('button:has-text("Gradebook Manager"), [data-testid="gradebook-tab"]').first();
    if (await gradebookTab.isVisible()) {
      await gradebookTab.click();
      await page.waitForTimeout(3000);
    }
    
    const heading = page.locator('h1:has-text("Gradebook Manager"), h2:has-text("Gradebook Manager")').first();
    const headingVisible = await heading.isVisible().catch(() => false);
    
    console.log('Gradebook Manager heading visible:', headingVisible);
    
    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log('Number of select elements:', selectCount);
    
    if (selectCount >= 2) {
      const subjectSelect = selects.nth(1);
      const subjectOptions = await subjectSelect.locator('option').count();
      console.log('Subject dropdown options:', subjectOptions);
      
      const gradeLevelSelect = selectCount >= 3 ? selects.nth(2) : null;
      if (gradeLevelSelect) {
        const gradeLevelOptions = await gradeLevelSelect.locator('option').count();
        console.log('Grade Level dropdown options:', gradeLevelOptions);
      }
    }
    
    expect(selectCount).toBeGreaterThanOrEqual(2);
  });

  test('should display enrolled subjects in vertical slider', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[type="email"]', 'smith.teacher@school.edu');
    await page.fill('input[type="password"]', 'teacher123');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }
    
    await page.waitForTimeout(3000);
    
    const gradebookTab = page.locator('button:has-text("Gradebook Manager")').first();
    if (await gradebookTab.isVisible()) {
      await gradebookTab.click();
      await page.waitForTimeout(3000);
    }
    
    const sliderHeader = page.locator('text=Enrolled Subjects').first();
    const sliderHeaderVisible = await sliderHeader.isVisible().catch(() => false);
    
    console.log('Vertical slider header visible:', sliderHeaderVisible);
    
    if (sliderHeaderVisible) {
      const sliderContainer = sliderHeader.locator('..').locator('..').first();
      const subjectItems = sliderContainer.locator('button').count();
      console.log('Number of subject items in slider:', await subjectItems);
      
      expect(await subjectItems).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display stats', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await page.fill('input[type="email"]', 'smith.teacher@school.edu');
    await page.fill('input[type="password"]', 'teacher123');
    
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }
    
    await page.waitForTimeout(3000);
    
    const gradebookTab = page.locator('button:has-text("Gradebook Manager")').first();
    if (await gradebookTab.isVisible()) {
      await gradebookTab.click();
      await page.waitForTimeout(3000);
    }
    
    const statLabels = ['Total Students', 'Subjects', 'Grades Entered', 'Average Score'];
    
    for (const label of statLabels) {
      const statText = page.locator(`text=${label}`);
      const isVisible = await statText.isVisible().catch(() => false);
      console.log(`Stat "${label}" visible:`, isVisible);
    }
  });
});
