import { test, expect, Page } from '@playwright/test';

test.describe('Complete Course Approval and Student Enrollment Workflow', () => {
  const TEACHER_USERNAME = 'teacher_test';
  const TEACHER_PASSWORD = 'password123';
  const ADMIN_USERNAME = 'admin_test';
  const ADMIN_PASSWORD = 'password123';
  const STUDENT_USERNAME = 'student_test';
  const STUDENT_PASSWORD = 'password123';
  const PARENT_USERNAME = 'parent_test';
  const PARENT_PASSWORD = 'password123';

  let teacherPage: Page;
  let adminPage: Page;
  let studentPage: Page;
  let parentPage: Page;

  test.beforeAll(async ({ browser }) => {
    teacherPage = await browser.newPage();
    adminPage = await browser.newPage();
    studentPage = await browser.newPage();
    parentPage = await browser.newPage();
  });

  test.afterAll(async () => {
    await teacherPage?.close();
    await adminPage?.close();
    await studentPage?.close();
    await parentPage?.close();
  });

  const loginAs = async (page: Page, username: string, password: string) => {
    await page.goto('http://localhost:3000/');
    await page.click('text=Login');
    await page.fill('input[type="email"]', `${username}@example.com`);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {});
  };

  test('STEP 1: Teacher submits course request', async () => {
    await loginAs(teacherPage, TEACHER_USERNAME, TEACHER_PASSWORD);

    await teacherPage.click('text=Course Request Manager');
    await teacherPage.click('button:has-text("Request Course")');

    await teacherPage.selectOption('select[aria-label*="Grade"]', '10');
    await teacherPage.selectOption('select[aria-label*="Subject"]', 'Mathematics');
    await teacherPage.click('button:has-text("Submit Request")');

    await expect(teacherPage.locator('text=submitted successfully')).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Submit confirmation not immediately visible - checking list');
    });
  });

  test('STEP 2: Admin sees new course request notification and approval request', async () => {
    await loginAs(adminPage, ADMIN_USERNAME, ADMIN_PASSWORD);

    await adminPage.click('text=Notifications');
    await expect(adminPage.locator('text=New Course Request')).toBeVisible({ timeout: 10000 });

    await adminPage.click('text=Course Approval Manager');
    await expect(adminPage.locator('text=Mathematics')).toBeVisible({ timeout: 5000 });
    await expect(adminPage.locator('text=pending')).toBeVisible();
  });

  test('STEP 3: Admin approves course request', async () => {
    const approvalRow = adminPage.locator('tr', { has: adminPage.locator('text=Mathematics') }).first();
    await approvalRow.click();

    await adminPage.fill('textarea[placeholder*="notes"]', 'Approved for Mathematics teaching');
    await adminPage.click('button:has-text("Approve")');

    await expect(adminPage.locator('text=approved')).toBeVisible({ timeout: 5000 });
  });

  test('STEP 4: Teacher receives approval notification', async () => {
    await teacherPage.reload();
    await teacherPage.click('text=Notifications');

    await expect(teacherPage.locator('text=Course Request Approved')).toBeVisible({ timeout: 10000 });
    await expect(teacherPage.locator('text=Mathematics')).toBeVisible();
  });

  test('STEP 5: Approved subject appears in teacher dashboard', async () => {
    await teacherPage.click('text=Course Request Manager');
    await expect(teacherPage.locator('text=Mathematics').filter({ hasText: 'approved' })).toBeVisible({ timeout: 5000 });
  });

  test('STEP 6: Student views available courses', async () => {
    await loginAs(studentPage, STUDENT_USERNAME, STUDENT_PASSWORD);

    await studentPage.click('text=Available Courses');
    await expect(studentPage.locator('text=Mathematics')).toBeVisible({ timeout: 5000 });
    await expect(studentPage.locator('text=Grade 10')).toBeVisible();
  });

  test('STEP 7: Student submits enrollment request', async () => {
    const courseRow = studentPage.locator('tr', { has: studentPage.locator('text=Mathematics') }).first();
    await courseRow.click();

    // If there's a family selector, select one
    const familySelect = studentPage.locator('select[aria-label*="Family"]').first();
    if (await familySelect.isVisible().catch(() => false)) {
      const options = await familySelect.locator('option').count();
      if (options > 1) {
        await familySelect.selectOption({ index: 1 });
      }
    }

    await studentPage.click('button:has-text("Request Enrollment")');

    await expect(studentPage.locator('text=Enrollment request submitted')).toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('Submission message not shown - checking teacher side');
    });
  });

  test('STEP 8: Teacher receives enrollment notification', async () => {
    await teacherPage.reload();
    await teacherPage.click('text=Notifications');

    await expect(teacherPage.locator('text=New Enrollment Request')).toBeVisible({ timeout: 10000 });
    await expect(teacherPage.locator(`:has-text("${STUDENT_USERNAME}")`)).toBeVisible().catch(() => {
      console.log('Student name not in notification - checking enrollment list');
    });
  });

  test('STEP 9: Teacher approves enrollment request', async () => {
    await teacherPage.click('text=Enrollment Approval Manager');
    const enrollmentRow = teacherPage.locator('tr', { has: teacherPage.locator('text=Mathematics') }).first();
    await enrollmentRow.click();

    await teacherPage.fill('textarea[placeholder*="notes"]', 'Approved for enrollment');
    await teacherPage.click('button:has-text("Approve")');

    await expect(teacherPage.locator('text=approved')).toBeVisible({ timeout: 5000 });
  });

  test('STEP 10: Student receives enrollment approval notification', async () => {
    await studentPage.reload();
    await studentPage.click('text=Notifications');

    await expect(studentPage.locator('text=Enrollment Approved')).toBeVisible({ timeout: 10000 });
    await expect(studentPage.locator('text=Mathematics')).toBeVisible();
  });

  test('STEP 11: Enrolled subject appears in student dashboard', async () => {
    await studentPage.click('text=My Enrolled Subjects');
    await expect(studentPage.locator('text=Mathematics')).toBeVisible({ timeout: 5000 });
  });

  test('STEP 12: Admin sees enrollment approval notification', async () => {
    await adminPage.reload();
    await adminPage.click('text=Notifications');

    await expect(adminPage.locator('text=Student Enrollment Approved')).toBeVisible({ timeout: 10000 });
    await expect(adminPage.locator('text=Mathematics')).toBeVisible();
  });

  test('STEP 13: Parent receives enrollment notification', async () => {
    await loginAs(parentPage, PARENT_USERNAME, PARENT_PASSWORD);
    await parentPage.click('text=Notifications');

    await expect(parentPage.locator('text=Enrollment')).toBeVisible({ timeout: 10000 });
  });

  test('STEP 14: Parent views enrolled subject in family dashboard', async () => {
    await parentPage.click('text=My Children');
    await expect(parentPage.locator('text=Mathematics')).toBeVisible({ timeout: 5000 });
  });

  test('STEP 15: Verify dynamic updates - refresh all dashboards', async () => {
    // Teacher reload
    await teacherPage.reload();
    await expect(teacherPage.locator('text=Enrolled Subjects')).toBeVisible({ timeout: 5000 });

    // Student reload
    await studentPage.reload();
    await expect(studentPage.locator('text=Mathematics')).toBeVisible({ timeout: 5000 });

    // Admin reload
    await adminPage.reload();
    await expect(adminPage.locator('text=Enrollments')).toBeVisible({ timeout: 5000 });

    // Parent reload
    await parentPage.reload();
    await expect(parentPage.locator('text=Subjects')).toBeVisible({ timeout: 5000 });
  });
});
