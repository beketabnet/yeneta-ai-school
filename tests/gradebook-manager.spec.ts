import { test, expect } from '@playwright/test';

test.describe.serial('Gradebook Manager', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Assume login as teacher - this would need to be implemented based on auth system
    // For now, assume we're logged in and on teacher dashboard
    await page.goto('/teacher');
  });

  test('should display gradebook manager tab', async ({ page }) => {
    // Check if Gradebook Manager tab exists
    await expect(page.getByRole('tab', { name: 'Gradebook Manager' })).toBeVisible();
  });

  test('should load gradebook manager interface', async ({ page }) => {
    // Click on Gradebook Manager tab
    await page.getByRole('tab', { name: 'Gradebook Manager' }).click();

    // Check if the interface loads
    await expect(page.getByText('Gradebook Manager')).toBeVisible();
    await expect(page.getByText('Grade Level')).toBeVisible();
    await expect(page.getByText('Subject')).toBeVisible();
    await expect(page.getByText('Stream')).toBeVisible();
    await expect(page.getByText('Assignment Type')).toBeVisible();
  });

  test('should filter students by grade level', async ({ page }) => {
    await page.getByRole('tab', { name: 'Gradebook Manager' }).click();

    // Select grade level 10
    await page.selectOption('select[aria-label="Grade Level"]', '10');

    // Check if students from grade 10 are displayed
    await expect(page.getByText('Grade 10')).toBeVisible();
  });

  test('should display gradebook table with students and assignments', async ({ page }) => {
    await page.getByRole('tab', { name: 'Gradebook Manager' }).click();

    // Select filters to show data
    await page.selectOption('select[aria-label="Grade Level"]', '10');
    await page.selectOption('select[aria-label="Subject"]', 'Mathematics');

    // Check if table is displayed
    await expect(page.locator('table')).toBeVisible();

    // Check if student names are displayed
    await expect(page.getByText('Abebe Kebede')).toBeVisible();
    await expect(page.getByText('Tirunesh Dibaba')).toBeVisible();
  });

  test('should allow editing grades inline', async ({ page }) => {
    await page.getByRole('tab', { name: 'Gradebook Manager' }).click();

    // Select filters
    await page.selectOption('select[aria-label="Grade Level"]', '10');
    await page.selectOption('select[aria-label="Subject"]', 'Mathematics');

    // Click on a grade cell to edit
    const gradeCell = page.locator('td').filter({ hasText: '95' }).first();
    await gradeCell.click();

    // Check if input field appears
    await expect(page.locator('input[type="number"]')).toBeVisible();

    // Enter new grade
    await page.locator('input[type="number"]').fill('90');

    // Click save button
    await page.getByRole('button', { name: 'Save' }).click();

    // Check if grade is updated
    await expect(page.getByText('90')).toBeVisible();
  });

  test('should validate grade input', async ({ page }) => {
    await page.getByRole('tab', { name: 'Gradebook Manager' }).click();

    // Select filters
    await page.selectOption('select[aria-label="Grade Level"]', '10');
    await page.selectOption('select[aria-label="Subject"]', 'Mathematics');

    // Click on a grade cell
    const gradeCell = page.locator('td').filter({ hasText: '95' }).first();
    await gradeCell.click();

    // Try to enter invalid grade (above max)
    await page.locator('input[type="number"]').fill('150');

    // Click save
    await page.getByRole('button', { name: 'Save' }).click();

    // Should show error or not save
    await expect(page.getByText('Score cannot exceed maximum score')).toBeVisible();
  });

  test('should cancel grade editing', async ({ page }) => {
    await page.getByRole('tab', { name: 'Gradebook Manager' }).click();

    // Select filters
    await page.selectOption('select[aria-label="Grade Level"]', '10');
    await page.selectOption('select[aria-label="Subject"]', 'Mathematics');

    // Click on a grade cell
    const gradeCell = page.locator('td').filter({ hasText: '95' }).first();
    await gradeCell.click();

    // Enter new value
    await page.locator('input[type="number"]').fill('88');

    // Click cancel
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Check if original value is still there
    await expect(page.getByText('95')).toBeVisible();
  });

  test('should persist grade changes', async ({ page }) => {
    await page.getByRole('tab', { name: 'Gradebook Manager' }).click();

    // Select filters
    await page.selectOption('select[aria-label="Grade Level"]', '10');
    await page.selectOption('select[aria-label="Subject"]', 'Mathematics');

    // Edit a grade
    const gradeCell = page.locator('td').filter({ hasText: '95' }).first();
    await gradeCell.click();
    await page.locator('input[type="number"]').fill('92');
    await page.getByRole('button', { name: 'Save' }).click();

    // Refresh page
    await page.reload();

    // Re-select filters
    await page.selectOption('select[aria-label="Grade Level"]', '10');
    await page.selectOption('select[aria-label="Subject"]', 'Mathematics');

    // Check if grade is still updated
    await expect(page.getByText('92')).toBeVisible();
  });
});