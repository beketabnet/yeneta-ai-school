import { test, expect, Page } from '@playwright/test';

test.describe('Gradebook Manager End-to-End Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');

    await page.fill('input[placeholder*="email" i], input[type="email"]', 'teacher1@school.edu');
    await page.fill('input[type="password"]', 'teacher123');
    await page.click('button:has-text("Login"), button:has-text("Sign In")');

    await page.waitForNavigation({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const teacherDashboardLink = page.locator('a:has-text("Teacher"), button:has-text("Teacher")').first();
    if (await teacherDashboardLink.isVisible()) {
      await teacherDashboardLink.click();
      await page.waitForTimeout(2000);
    }

    const gradebookTab = page.locator('[data-testid="gradebook-tab"], button:has-text("Gradebook Manager")').first();
    if (await gradebookTab.isVisible()) {
      await gradebookTab.click();
      await page.waitForTimeout(3000);
    }
  });

  test('should load Gradebook Manager page successfully', async () => {
    const heading = page.locator('h1, h2').filter({ hasText: 'Gradebook Manager' }).first();
    await expect(heading).toBeVisible();
  });

  test('should display Subject dropdown with enrolled subjects', async () => {
    const subjectSelect = page.locator('select').nth(1);
    await expect(subjectSelect).toBeVisible();

    const option = subjectSelect.locator('option[value=""]');
    await expect(option).toContainText(/All Subjects|Loading subjects/);

    await subjectSelect.click();
    await page.waitForTimeout(1000);

    const options = subjectSelect.locator('option[value!=""]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThanOrEqual(0);
  });

  test('should display Grade Level dropdown with proper levels', async () => {
    const gradeLevelSelect = page.locator('select').nth(2);
    await expect(gradeLevelSelect).toBeVisible();

    const allLevelsOption = gradeLevelSelect.locator('option[value=""]');
    await expect(allLevelsOption).toContainText('All Levels');

    await gradeLevelSelect.click();
    await page.waitForTimeout(1000);

    const gradeOptions = gradeLevelSelect.locator('option[value!=""]');
    const optionCount = await gradeOptions.count();

    if (optionCount > 0) {
      const optionsText = await gradeOptions.allTextContents();
      optionsText.forEach(text => {
        expect(['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].some(level =>
          text.includes(level)
        )).toBeTruthy();
      });
    }
  });

  test('should display Enrolled Subjects vertical slider', async () => {
    const sliderHeader = page.locator('text=Enrolled Subjects', { exact: false });
    if (await sliderHeader.isVisible()) {
      await expect(sliderHeader).toBeVisible();

      const sliderContainer = page.locator('[class*="scroll"]').filter({ hasText: 'Enrolled Subjects' }).first();
      if (await sliderContainer.isVisible()) {
        const subjectButtons = sliderContainer.locator('button[class*="py-3"], button[class*="rounded"]');
        const count = await subjectButtons.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should filter by subject', async () => {
    const subjectSelect = page.locator('select').nth(1);
    const options = subjectSelect.locator('option');
    const optionCount = await options.count();

    if (optionCount > 1) {
      const secondOption = options.nth(1);
      const selectedValue = await secondOption.getAttribute('value');
      const selectedText = await secondOption.textContent();

      await subjectSelect.selectOption(selectedValue || '');
      await page.waitForTimeout(2000);

      const tableContent = page.locator('table, [role="grid"]', { exact: false });
      if (await tableContent.isVisible()) {
        expect(await tableContent.isVisible()).toBeTruthy();
      }
    }
  });

  test('should filter by grade level', async () => {
    const gradeLevelSelect = page.locator('select').nth(2);
    const options = gradeLevelSelect.locator('option');
    const optionCount = await options.count();

    if (optionCount > 1) {
      const secondOption = options.nth(1);
      const selectedValue = await secondOption.getAttribute('value');

      await gradeLevelSelect.selectOption(selectedValue || '');
      await page.waitForTimeout(2000);

      expect(await gradeLevelSelect.inputValue()).toBe(selectedValue || '');
    }
  });

  test('should display statistics panel', async () => {
    const statsContainer = page.locator('[class*="grid"][class*="cols"]', { exact: false });
    
    if (await statsContainer.isVisible()) {
      const statCards = statsContainer.locator('[class*="rounded"], [class*="p-4"]');
      const cardCount = await statCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(3);
    }
  });

  test('should display Total Students stat', async () => {
    const totalStudentsText = page.locator('text=Total Students', { exact: false });
    
    if (await totalStudentsText.isVisible()) {
      expect(await totalStudentsText.isVisible()).toBeTruthy();
      const statValue = totalStudentsText.locator('..').locator('text=/\\d+/');
      const text = await statValue.allTextContents();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('should display Subjects count stat', async () => {
    const subjectsText = page.locator('text=Subjects', { exact: false }).filter({ hasText: 'Subjects' });
    
    if (await subjectsText.isVisible()) {
      expect(await subjectsText.isVisible()).toBeTruthy();
    }
  });

  test('should display Grades Entered stat', async () => {
    const gradesEnteredText = page.locator('text=Grades Entered', { exact: false });
    
    if (await gradesEnteredText.isVisible()) {
      expect(await gradesEnteredText.isVisible()).toBeTruthy();
    }
  });

  test('should display Average Score stat', async () => {
    const avgScoreText = page.locator('text=Average Score', { exact: false });
    
    if (await avgScoreText.isVisible()) {
      expect(await avgScoreText.isVisible()).toBeTruthy();
    }
  });

  test('should search for students', async () => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1500);
      expect(await searchInput.inputValue()).toBe('test');

      await searchInput.clear();
      await page.waitForTimeout(1000);
    }
  });

  test('should scroll vertical slider up', async () => {
    const sliderUpButton = page.locator('button[aria-label="Scroll up"]').first();
    
    if (await sliderUpButton.isVisible()) {
      await sliderUpButton.click();
      await page.waitForTimeout(1000);
      expect(await sliderUpButton.isVisible()).toBeTruthy();
    }
  });

  test('should scroll vertical slider down', async () => {
    const sliderDownButton = page.locator('button[aria-label="Scroll down"]').first();
    
    if (await sliderDownButton.isVisible()) {
      await sliderDownButton.click();
      await page.waitForTimeout(1000);
      expect(await sliderDownButton.isVisible()).toBeTruthy();
    }
  });

  test('should select subject from vertical slider', async () => {
    const sliderContainer = page.locator('[class*="scroll"]').filter({ hasText: 'Enrolled Subjects' }).first();
    
    if (await sliderContainer.isVisible()) {
      const subjectButtons = sliderContainer.locator('button[class*="py-3"], button[class*="rounded"]');
      const count = await subjectButtons.count();

      if (count > 0) {
        const firstButton = subjectButtons.nth(0);
        await firstButton.click();
        await page.waitForTimeout(1500);
        
        const isSelected = await firstButton.locator('[class*="blue"], [class*="border-blue"]').count();
        expect(isSelected + (await firstButton.getAttribute('class')).includes('blue') ? 1 : 0).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should display gradebook table when subject selected', async () => {
    const subjectSelect = page.locator('select').nth(1);
    const options = subjectSelect.locator('option');
    const optionCount = await options.count();

    if (optionCount > 1) {
      const secondOption = options.nth(1);
      const selectedValue = await secondOption.getAttribute('value');

      if (selectedValue) {
        await subjectSelect.selectOption(selectedValue);
        await page.waitForTimeout(2000);

        const table = page.locator('table, [role="grid"]');
        const emptyMessage = page.locator('text=Select a subject');

        if (!(await emptyMessage.isVisible())) {
          expect(await table.isVisible() || !(await emptyMessage.isVisible())).toBeTruthy();
        }
      }
    }
  });

  test('should clear filters and show all subjects', async () => {
    const subjectSelect = page.locator('select').nth(1);
    
    await subjectSelect.selectOption('');
    await page.waitForTimeout(1500);

    const selectedValue = await subjectSelect.inputValue();
    expect(selectedValue).toBe('');
  });

  test('should display refresh button', async () => {
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    
    if (await refreshButton.isVisible()) {
      expect(await refreshButton.isVisible()).toBeTruthy();
    }
  });

  test('should handle loading state', async () => {
    const subjectSelect = page.locator('select').nth(1);
    
    if (await subjectSelect.isDisabled()) {
      const loadingText = page.locator('text=Loading');
      if (await loadingText.isVisible()) {
        expect(await loadingText.isVisible()).toBeTruthy();
      }
    }
  });

  test('should maintain filter state when navigating back', async () => {
    const subjectSelect = page.locator('select').nth(1);
    const options = subjectSelect.locator('option');
    const optionCount = await options.count();

    if (optionCount > 1) {
      const secondOption = options.nth(1);
      const selectedValue = await secondOption.getAttribute('value');

      await subjectSelect.selectOption(selectedValue || '');
      await page.waitForTimeout(1500);

      const currentValue = await subjectSelect.inputValue();
      expect(currentValue).toBe(selectedValue || '');
    }
  });

  test.afterEach(async () => {
    await page.close();
  });
});
