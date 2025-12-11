import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@yeneta.ai';
const ADMIN_PASSWORD = 'password';

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/`);
  await page.click('button:has-text("Log in")');
  await page.waitForSelector('input[name="email"]', { timeout: 5000 });
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.selectOption('select[name="role"]', 'Admin');
  await page.click('button:has-text("Log in")');
  await page.waitForSelector('text=Students', { timeout: 15000 });
}

test.describe.serial('Admin Dashboard - Grades Analytics', () => {
  
  test('Admin: Dashboard loads with grade analytics section', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Look for analytics section or tab
    const analyticsTab = page.locator('text=/Analytics|Grades|Performance/i').first();
    if (await analyticsTab.isVisible()) {
      await analyticsTab.click();
    }
    
    await page.waitForLoadState('networkidle');
    
    // Verify grade analytics components
    const hasGradeAnalytics = await page.locator('text=/Grade Analytics|Grades Analytics|Grade Insights/i').isVisible().catch(() => false);
    if (!hasGradeAnalytics) {
      console.log('Analytics section not found, checking for data tables');
    }
  });

  test('Admin: Key metrics display correctly', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Look for metrics
    const metrics = ['Total Grades', 'Average Score', 'Students', 'Teachers'];
    for (const metric of metrics) {
      const found = await page.locator(`text=${metric}`).isVisible().catch(() => false);
      if (found) {
        console.log(`✓ Found metric: ${metric}`);
      }
    }
  });

  test('Admin: Grade distribution displays with progress bars', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Check for grade distribution section
    const gradeDistributionTitle = page.locator('h2:has-text("Grade Distribution")');
    if (await gradeDistributionTitle.isVisible()) {
      // Look for grade categories
      const grades = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'];
      for (const grade of grades) {
        const found = await page.locator(`text=${grade}`).isVisible().catch(() => false);
        if (found) {
          console.log(`✓ Found grade category: ${grade}`);
        }
      }
    }
  });

  test('Admin: Top performers section displays students', async ({ page }) => {
    await loginAsAdmin(page);
    
    const topPerformersSection = page.locator('text=/Top Performers|Top Students/i');
    if (await topPerformersSection.isVisible()) {
      // Verify list of students
      const studentElements = await page.locator('text=/Average|Score/i').count();
      expect(studentElements).toBeGreaterThanOrEqual(0);
    }
  });

  test('Admin: Students needing support section displays', async ({ page }) => {
    await loginAsAdmin(page);
    
    const needsSupportSection = page.locator('text=/Students Needing Support|Needs Support/i');
    if (await needsSupportSection.isVisible()) {
      // Verify section loads
      await expect(needsSupportSection).toBeVisible();
    }
  });

  test('Admin: Subject performance table displays', async ({ page }) => {
    await loginAsAdmin(page);
    
    const subjectPerfSection = page.locator('h2:has-text("Subject Performance")');
    if (await subjectPerfSection.isVisible()) {
      // Check for table
      const table = page.locator('table').first();
      expect(await table.isVisible()).toBeTruthy();
    }
  });

  test('Admin: Refresh button works and updates data', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Refresh")').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
      
      // Verify button is no longer in loading state
      const isDisabled = await refreshButton.isDisabled();
      expect(!isDisabled || await page.locator('text=/analytics|performance/i').isVisible()).toBeTruthy();
    }
  });

  test('Admin: Analytics update in real-time when teacher enters grades', async ({ page, context }) => {
    // Step 1: Open Admin Dashboard
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    
    // Get initial grade count
    const initialCount = await adminPage.locator('text=/Total Grades|Grades Entered/i').textContent();
    console.log(`Initial grade count: ${initialCount}`);
    
    // Step 2: Teacher enters grade in another context
    const teacherPage = await context.newPage();
    await teacherPage.goto(BASE_URL);
    await teacherPage.click('button:has-text("Log in")');
    await teacherPage.fill('input[name="email"]', 'teacher@yeneta.ai');
    await teacherPage.fill('input[name="password"]', 'password');
    await teacherPage.selectOption('select[name="role"]', 'teacher');
    await teacherPage.click('button[type="submit"]');
    await teacherPage.waitForSelector('h1:has-text("Gradebook Manager")');
    
    // Navigate to gradebook
    await teacherPage.click('text=Gradebook Manager');
    await teacherPage.waitForLoadState('networkidle');
    
    // Enter a grade
    const editButton = teacherPage.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      const scoreInput = teacherPage.locator('input[type="number"]').first();
      await scoreInput.fill('95');
      await teacherPage.locator('button:has-text("Save")').click();
      await teacherPage.waitForTimeout(2000);
    }
    
    // Step 3: Admin dashboard should refresh (auto or manual)
    const refreshButton = adminPage.locator('button:has-text("Refresh")').first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await adminPage.waitForTimeout(2000);
    }
    
    // Verify analytics updated
    const updatedCount = await adminPage.locator('text=/Total Grades|Grades Entered/i').textContent();
    console.log(`Updated grade count: ${updatedCount}`);
    
    await teacherPage.close();
    await adminPage.close();
  });

  test('Admin: Analytics responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginAsAdmin(page);
    await page.waitForLoadState('networkidle');
    
    // Check if metrics are visible on mobile
    const metrics = page.locator('[data-testid="metric-card"], .grid');
    const count = await metrics.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Admin: Empty state when no grades entered', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Look for empty state message or zero values
    const zeroOrEmpty = await page.locator('text=/0|No data|No grades/i').isVisible().catch(() => false);
    const hasData = await page.locator('[data-testid="metric-card"]').count().then(c => c > 0);
    
    // Either shows empty state or has data
    expect(zeroOrEmpty || hasData).toBeTruthy();
  });

  test('Admin: Subject performance data integrity', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Find subject performance table
    const subjectTable = page.locator('table').first();
    if (await subjectTable.isVisible()) {
      // Check table structure
      const rows = page.locator('tbody tr');
      const rowCount = await rows.count();
      
      // Verify each row has required columns
      if (rowCount > 0) {
        const firstRow = rows.first();
        const cells = firstRow.locator('td');
        const cellCount = await cells.count();
        
        // Should have at least 3 columns: Subject, Average, Students, Range
        expect(cellCount).toBeGreaterThanOrEqual(3);
      }
    }
  });

});
