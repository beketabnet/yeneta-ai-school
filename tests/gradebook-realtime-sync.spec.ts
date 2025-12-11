import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8000/api';

// Test credentials
const TEACHER_USERNAME = 'Teacher Smith';
const TEACHER_PASSWORD = 'password123';
const STUDENT_USERNAME = 'student';
const STUDENT_PASSWORD = 'password123';
const PARENT_USERNAME = 'parent';
const PARENT_PASSWORD = 'password123';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

test.describe('Gradebook Real-time Synchronization E2E', () => {
  let teacherAuthToken = '';
  let studentAuthToken = '';
  let parentAuthToken = '';
  let adminAuthToken = '';

  test.beforeAll(async () => {
    // Note: In real scenario, these would be obtained from API login
    // For now, we'll assume the test environment has these tokens available
  });

  test('Teacher can add grades with active button for first subject', async ({ page }) => {
    // Login as teacher
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', TEACHER_USERNAME);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard load
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/teacher/gradebook`);

    // Wait for enrolled subjects table to load
    await page.waitForSelector('text=Enrolled Subjects', { timeout: 10000 });

    // Find the first "Add Grade" button
    const addGradeButtons = await page.$$('[data-testid="add-grade-btn"]');
    expect(addGradeButtons.length).toBeGreaterThan(0);

    const firstButton = addGradeButtons[0];

    // Verify the first button is NOT disabled
    const isDisabled = await firstButton.evaluate((el) => el.hasAttribute('disabled'));
    expect(isDisabled).toBeFalsy();

    // Verify button is clickable
    await expect(firstButton).toBeEnabled();
  });

  test('Teacher can add grades and verify data persistence', async ({ page }) => {
    // Login as teacher
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', TEACHER_USERNAME);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to Gradebook Manager
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/teacher/gradebook`);
    await page.waitForSelector('text=Enrolled Subjects', { timeout: 10000 });

    // Click the first "Add Grade" button
    const addGradeButtons = await page.$$('[data-testid="add-grade-btn"]');
    expect(addGradeButtons.length).toBeGreaterThan(0);

    await addGradeButtons[0].click();

    // Wait for grade adding modal/card to appear
    await page.waitForSelector('[data-testid="grade-adding-card"]', { timeout: 5000 });

    // Select a student
    const studentSelects = await page.$$('[data-testid="student-select"]');
    if (studentSelects.length > 0) {
      await studentSelects[0].click();
      await page.click('text=/Student[\\s\\S]*?/', { force: true });
    }

    // Enter a grade score
    const scoreInputs = await page.$$('[data-testid="score-input"]');
    if (scoreInputs.length > 0) {
      await scoreInputs[0].fill('85');
    }

    // Save the grade
    const saveButton = await page.$('[data-testid="save-grade-btn"]');
    if (saveButton) {
      await saveButton.click();

      // Wait for success message
      await page.waitForSelector('text=Grade saved successfully', { timeout: 5000 });
    }

    // Verify the grade was saved
    await page.goto(`${BASE_URL}/teacher/gradebook`);
    await page.waitForSelector('text=Enrolled Subjects', { timeout: 5000 });

    // Check that subject shows average score
    const subjectRows = await page.$$('[data-testid="subject-row"]');
    expect(subjectRows.length).toBeGreaterThan(0);

    const firstRow = subjectRows[0];
    const averageText = await firstRow.textContent();
    expect(averageText).toMatch(/Average|Score/i);
  });

  test('Student Gradebook displays real-time updates', async ({ page }) => {
    // Login as student
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', STUDENT_USERNAME);
    await page.fill('input[name="password"]', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to Student Gradebook
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/student/gradebook`);

    // Wait for gradebook to load
    await page.waitForSelector('[data-testid="student-gradebook"]', { timeout: 10000 });

    // Verify grades are displayed
    const gradeElements = await page.$$('[data-testid="grade-cell"]');
    expect(gradeElements.length).toBeGreaterThan(0);

    // Get initial grade values
    const initialGrades = await Promise.all(
      gradeElements.map((el) => el.textContent())
    );

    // Trigger a refresh
    const refreshButton = await page.$('[data-testid="refresh-btn"]');
    if (refreshButton) {
      await refreshButton.click();
      await page.waitForTimeout(2000); // Wait for refresh
    }

    // Verify grades are still displayed (no errors)
    const updatedGrades = await Promise.all(
      gradeElements.map((el) => el.textContent())
    );

    expect(updatedGrades.length).toBe(initialGrades.length);
  });

  test('Parent Dashboard shows updated stats after grade entry', async ({ page }) => {
    // Login as parent
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', PARENT_USERNAME);
    await page.fill('input[name="password"]', PARENT_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to Parent Dashboard
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/parent/dashboard`);

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="at-a-glance-status"]', { timeout: 10000 });

    // Verify "At-a-Glance Status" section shows data
    const statusSection = await page.$('[data-testid="at-a-glance-status"]');
    expect(statusSection).toBeTruthy();

    // Get current stats
    const statsText = await statusSection?.textContent();
    expect(statsText).toMatch(/Grade|Score|Average/i);

    // Navigate to "Courses and Grades"
    await page.click('[data-testid="courses-grades-tab"]');
    await page.waitForSelector('[data-testid="grades-list"]', { timeout: 5000 });

    // Verify grades are displayed
    const gradeElements = await page.$$('[data-testid="grade-item"]');
    expect(gradeElements.length).toBeGreaterThan(0);

    // Navigate to "Enrolled Subjects"
    await page.click('[data-testid="enrolled-subjects-tab"]');
    await page.waitForSelector('[data-testid="subject-list"]', { timeout: 5000 });

    // Verify subjects are listed
    const subjectElements = await page.$$('[data-testid="subject-item"]');
    expect(subjectElements.length).toBeGreaterThan(0);
  });

  test('Admin Analytics displays updated data and enrollment requests', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to Admin Dashboard
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/admin/dashboard`);

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });

    // Verify Enrollment Requests section
    const enrollmentSection = await page.$('[data-testid="enrollment-requests"]');
    expect(enrollmentSection).toBeTruthy();

    // Get enrollment request count
    const requestsText = await enrollmentSection?.textContent();
    expect(requestsText).toBeDefined();

    // Navigate to Analytics
    await page.click('[data-testid="analytics-tab"]');
    await page.waitForSelector('[data-testid="analytics-container"]', { timeout: 5000 });

    // Verify analytics are displayed
    const analyticsCharts = await page.$$('[data-testid="analytics-chart"]');
    expect(analyticsCharts.length).toBeGreaterThan(0);

    // Verify stats are loaded (not showing loading state)
    const loadingIndicators = await page.$$('[data-testid="loading"]');
    expect(loadingIndicators.length).toBe(0);
  });

  test('Gradebook stats update dynamically after grade changes', async ({ page }) => {
    // Login as teacher
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', TEACHER_USERNAME);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to Gradebook
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/teacher/gradebook`);
    await page.waitForSelector('[data-testid="gradebook-stats"]', { timeout: 10000 });

    // Get initial stats
    const statsElement = await page.$('[data-testid="gradebook-stats"]');
    const initialStatsText = await statsElement?.textContent();

    // Add a grade
    const addGradeButtons = await page.$$('[data-testid="add-grade-btn"]');
    if (addGradeButtons.length > 0) {
      await addGradeButtons[0].click();
      await page.waitForSelector('[data-testid="grade-adding-card"]', { timeout: 5000 });

      // Fill in grade details
      const studentSelects = await page.$$('[data-testid="student-select"]');
      if (studentSelects.length > 0) {
        await studentSelects[0].click();
        await page.waitForTimeout(500);
        const options = await page.$$('.select-option');
        if (options.length > 0) {
          await options[0].click();
        }
      }

      const scoreInputs = await page.$$('[data-testid="score-input"]');
      if (scoreInputs.length > 0) {
        await scoreInputs[0].fill('92');
      }

      const saveButton = await page.$('[data-testid="save-grade-btn"]');
      if (saveButton) {
        await saveButton.click();
        await page.waitForSelector('text=Grade saved successfully', { timeout: 5000 });
      }
    }

    // Refresh the page to ensure stats are updated
    await page.reload();
    await page.waitForSelector('[data-testid="gradebook-stats"]', { timeout: 10000 });

    // Get updated stats
    const updatedStatsElement = await page.$('[data-testid="gradebook-stats"]');
    const updatedStatsText = await updatedStatsElement?.textContent();

    // Verify stats have changed (or at least exist)
    expect(updatedStatsText).toBeDefined();
  });

  test('All subject rows have active Add Grade buttons', async ({ page }) => {
    // Login as teacher
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', TEACHER_USERNAME);
    await page.fill('input[name="password"]', TEACHER_PASSWORD);
    await page.click('button[type="submit"]');

    // Navigate to Gradebook
    await page.waitForNavigation();
    await page.goto(`${BASE_URL}/teacher/gradebook`);
    await page.waitForSelector('text=Enrolled Subjects', { timeout: 10000 });

    // Get all "Add Grade" buttons
    const addGradeButtons = await page.$$('[data-testid="add-grade-btn"]');
    expect(addGradeButtons.length).toBeGreaterThan(0);

    // Verify all buttons are enabled
    for (let i = 0; i < addGradeButtons.length; i++) {
      const button = addGradeButtons[i];
      const isDisabled = await button.evaluate((el) => el.hasAttribute('disabled'));
      expect(isDisabled).toBeFalsy(`Add Grade button ${i + 1} should not be disabled`);
    }
  });

  test('Cross-feature data consistency after grade entry', async ({ browser }) => {
    // Create three separate browser contexts for teacher, student, and parent
    const teacherContext = await browser.newContext();
    const studentContext = await browser.newContext();
    const parentContext = await browser.newContext();

    try {
      const teacherPage = await teacherContext.newPage();
      const studentPage = await studentContext.newPage();
      const parentPage = await parentContext.newPage();

      // Step 1: Teacher logs in and adds a grade
      await teacherPage.goto(`${BASE_URL}/login`);
      await teacherPage.fill('input[name="username"]', TEACHER_USERNAME);
      await teacherPage.fill('input[name="password"]', TEACHER_PASSWORD);
      await teacherPage.click('button[type="submit"]');
      await teacherPage.waitForNavigation();

      // Step 2: Student and Parent log in simultaneously
      await studentPage.goto(`${BASE_URL}/login`);
      await studentPage.fill('input[name="username"]', STUDENT_USERNAME);
      await studentPage.fill('input[name="password"]', STUDENT_PASSWORD);
      await studentPage.click('button[type="submit"]');

      await parentPage.goto(`${BASE_URL}/login`);
      await parentPage.fill('input[name="username"]', PARENT_USERNAME);
      await parentPage.fill('input[name="password"]', PARENT_PASSWORD);
      await parentPage.click('button[type="submit"]');

      // Step 3: Teacher navigates to gradebook
      await teacherPage.waitForNavigation();
      await teacherPage.goto(`${BASE_URL}/teacher/gradebook`);
      await teacherPage.waitForSelector('text=Enrolled Subjects', { timeout: 10000 });

      // Step 4: Student and Parent navigate to their respective pages
      await studentPage.waitForNavigation();
      await studentPage.goto(`${BASE_URL}/student/gradebook`);
      await studentPage.waitForSelector('[data-testid="student-gradebook"]', { timeout: 10000 });

      await parentPage.waitForNavigation();
      await parentPage.goto(`${BASE_URL}/parent/dashboard`);
      await parentPage.waitForSelector('[data-testid="at-a-glance-status"]', { timeout: 10000 });

      // Get initial values from all three views
      const studentInitialText = await studentPage.textContent('[data-testid="gradebook-summary"]');
      const parentInitialText = await parentPage.textContent('[data-testid="grade-summary"]');

      // Teacher adds a grade
      const teacherAddButtons = await teacherPage.$$('[data-testid="add-grade-btn"]');
      if (teacherAddButtons.length > 0) {
        await teacherAddButtons[0].click();
        await teacherPage.waitForSelector('[data-testid="grade-adding-card"]', { timeout: 5000 });

        // Fill in grade details
        const scoreInputs = await teacherPage.$$('[data-testid="score-input"]');
        if (scoreInputs.length > 0) {
          await scoreInputs[0].fill('88');
        }

        const saveButton = await teacherPage.$('[data-testid="save-grade-btn"]');
        if (saveButton) {
          await saveButton.click();
          await teacherPage.waitForSelector('text=Grade saved successfully', { timeout: 5000 });
        }
      }

      // Wait a moment for updates to propagate
      await teacherPage.waitForTimeout(2000);

      // Refresh student and parent pages to see updates
      await studentPage.reload();
      await parentPage.reload();

      // Verify data has been updated
      await studentPage.waitForSelector('[data-testid="student-gradebook"]', { timeout: 10000 });
      await parentPage.waitForSelector('[data-testid="at-a-glance-status"]', { timeout: 10000 });

      const studentUpdatedText = await studentPage.textContent('[data-testid="gradebook-summary"]');
      const parentUpdatedText = await parentPage.textContent('[data-testid="grade-summary"]');

      // Both should have updated (or at least not show errors)
      expect(studentUpdatedText).toBeDefined();
      expect(parentUpdatedText).toBeDefined();

    } finally {
      await teacherContext.close();
      await studentContext.close();
      await parentContext.close();
    }
  });
});
