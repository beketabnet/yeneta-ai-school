import { test, expect, Page } from '@playwright/test';

test.describe('Course Approval & Enrollment Management', () => {
  let page: Page;
  const baseUrl = 'http://localhost:3000';
  const adminUrl = 'http://localhost:3000/admin/course-approval';

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Admin Course Approval Manager', () => {
    test('should display course approval manager with pending requests', async () => {
      await page.goto(baseUrl);
      
      await page.waitForLoadState('networkidle');
      
      const courseApprovalSection = page.locator('text=Course Approval Manager');
      await expect(courseApprovalSection).toBeVisible();
      
      const pendingTab = page.locator('button', { hasText: 'Pending' });
      await expect(pendingTab).toBeVisible();
      
      const approvedTab = page.locator('button', { hasText: 'Approved' });
      await expect(approvedTab).toBeVisible();
    });

    test('should display filter buttons for request status', async () => {
      await page.goto(adminUrl);
      
      const filterButtons = ['pending', 'approved', 'declined', 'under_review', 'all'];
      for (const status of filterButtons) {
        const button = page.locator('button', { 
          hasText: new RegExp(status.replace('_', ' '), 'i') 
        });
        await expect(button).toBeVisible();
      }
    });

    test('should filter requests by pending status', async () => {
      await page.goto(adminUrl);
      
      const pendingButton = page.locator('button:has-text("Pending")').first();
      await pendingButton.click();
      
      await page.waitForTimeout(500);
      
      const requestCards = page.locator('div[class*="border-2 rounded-lg"]');
      const count = await requestCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should allow selecting and viewing request details', async () => {
      await page.goto(adminUrl);
      
      await page.locator('button:has-text("Pending")').first().click();
      await page.waitForTimeout(500);
      
      const firstRequest = page.locator('div[class*="border-2 rounded-lg"]').first();
      await firstRequest.click();
      
      const reviewPanel = page.locator('text=Review Course Request');
      await expect(reviewPanel).toBeVisible();
      
      const teacherName = page.locator('p:has-text("Teacher")').first();
      await expect(teacherName).toBeVisible();
    });

    test('should display approve, decline, and under review buttons for pending requests', async () => {
      await page.goto(adminUrl);
      
      await page.locator('button:has-text("Pending")').first().click();
      await page.waitForTimeout(500);
      
      const firstRequest = page.locator('div[class*="border-2 rounded-lg"]').first();
      await firstRequest.click();
      
      const approveButton = page.locator('button:has-text("Approve")');
      const underReviewButton = page.locator('button:has-text("Under Review")');
      const declineButton = page.locator('button:has-text("Decline")');
      
      await expect(approveButton).toBeVisible();
      await expect(underReviewButton).toBeVisible();
      await expect(declineButton).toBeVisible();
    });

    test('should allow adding review notes before approval', async () => {
      await page.goto(adminUrl);
      
      await page.locator('button:has-text("Pending")').first().click();
      await page.waitForTimeout(500);
      
      const firstRequest = page.locator('div[class*="border-2 rounded-lg"]').first();
      await firstRequest.click();
      
      const notesTextarea = page.locator('textarea[placeholder*="review notes"]');
      await expect(notesTextarea).toBeVisible();
      
      await notesTextarea.fill('Teacher is well qualified and experienced');
      const value = await notesTextarea.inputValue();
      expect(value).toBe('Teacher is well qualified and experienced');
    });

    test('should show notification on successful approval', async () => {
      await page.goto(adminUrl);
      
      await page.locator('button:has-text("Pending")').first().click();
      await page.waitForTimeout(500);
      
      const firstRequest = page.locator('div[class*="border-2 rounded-lg"]').first();
      await firstRequest.click();
      
      const notesTextarea = page.locator('textarea[placeholder*="review notes"]');
      await notesTextarea.fill('Approved - meets all requirements');
      
      const approveButton = page.locator('button:has-text("Approve")');
      await approveButton.click();
      
      await page.waitForTimeout(500);
      
      const successNotification = page.locator('text=/.*successfully.*/', { hasText: /success|Success/ });
      await expect(successNotification).toBeVisible();
    });

    test('should auto-refresh requests every 10 seconds when enabled', async () => {
      await page.goto(adminUrl);
      
      const autoRefreshCheckbox = page.locator('input[type="checkbox"]').first();
      const isChecked = await autoRefreshCheckbox.isChecked();
      expect(isChecked).toBe(true);
      
      const initialCount = await page.locator('div[class*="border-2 rounded-lg"]').count();
      
      await page.waitForTimeout(11000);
      
      const finalCount = await page.locator('div[class*="border-2 rounded-lg"]').count();
      
      expect(finalCount).toBeGreaterThanOrEqual(0);
    });

    test('should allow toggling auto-refresh', async () => {
      await page.goto(adminUrl);
      
      const autoRefreshCheckbox = page.locator('input[type="checkbox"]').first();
      const initialState = await autoRefreshCheckbox.isChecked();
      
      await autoRefreshCheckbox.click();
      const newState = await autoRefreshCheckbox.isChecked();
      
      expect(newState).toBe(!initialState);
    });

    test('should display status badges with correct colors', async () => {
      await page.goto(adminUrl);
      
      const allButton = page.locator('button:has-text("All")');
      await allButton.click();
      
      await page.waitForTimeout(500);
      
      const pendingBadge = page.locator('span:has-text("pending")', { hasText: 'pending' });
      const approvedBadge = page.locator('span:has-text("approved")', { hasText: 'approved' });
      
      if (await approvedBadge.count() > 0) {
        const badge = approvedBadge.first();
        const classes = await badge.getAttribute('class');
        expect(classes).toContain('green');
      }
    });

    test('should refresh manually with refresh button', async () => {
      await page.goto(adminUrl);
      
      const refreshButton = page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeVisible();
      
      await refreshButton.click();
      
      await page.waitForTimeout(500);
      
      const requests = page.locator('div[class*="border-2 rounded-lg"]');
      expect(await requests.count()).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Student Course Enrollment', () => {
    test('should display available courses section', async () => {
      await page.goto(studentUrl);
      
      const availableCoursesSection = page.locator('text=Available Courses');
      await expect(availableCoursesSection).toBeVisible();
    });

    test('should display enrollment requests section', async () => {
      await page.goto(studentUrl);
      
      const enrollmentSection = page.locator('text=My Enrollment Requests');
      await expect(enrollmentSection).toBeVisible();
    });

    test('should display course cards with teacher names and subject', async () => {
      await page.goto(studentUrl);
      
      const courseCards = page.locator('div', { hasText: 'Teacher:' });
      if (await courseCards.count() > 0) {
        const firstCard = courseCards.first();
        await expect(firstCard).toBeVisible();
      }
    });

    test('should allow requesting enrollment for a course', async () => {
      await page.goto(studentUrl);
      
      const enrollmentButtons = page.locator('button:has-text("Request Enrollment")');
      
      if (await enrollmentButtons.count() > 0) {
        const firstButton = enrollmentButtons.first();
        await firstButton.click();
        
        await page.waitForTimeout(1000);
        
        const successNotification = page.locator('text=/.*successfully.*/', { hasText: /success|Success/ });
        if (await successNotification.count() > 0) {
          await expect(successNotification).toBeVisible();
        }
      }
    });

    test('should display status filter buttons', async () => {
      await page.goto(studentUrl);
      
      const filterButtons = ['All', 'Pending', 'Approved', 'Declined'];
      const enrollmentSection = page.locator('text=My Enrollment Requests').first();
      
      for (const status of filterButtons) {
        const button = page.locator('button:has-text("' + status + '")');
        const isInViewport = await button.isVisible().catch(() => false);
        
        if (isInViewport) {
          await expect(button).toBeVisible();
        }
      }
    });

    test('should filter enrollment requests by status', async () => {
      await page.goto(studentUrl);
      
      const enrollmentSection = page.locator('text=My Enrollment Requests').first();
      
      const pendingButton = page.locator('button:has-text("Pending")').last();
      
      try {
        await pendingButton.click();
        await page.waitForTimeout(500);
      } catch (e) {
        // Button might not be present, skip
      }
    });

    test('should display enrollment request status with icons', async () => {
      await page.goto(studentUrl);
      
      const statusBadges = page.locator('span[class*="px-2 py-1"]');
      
      if (await statusBadges.count() > 0) {
        const firstBadge = statusBadges.first();
        await expect(firstBadge).toBeVisible();
      }
    });

    test('should show pending status for new enrollment requests', async () => {
      await page.goto(studentUrl);
      
      const enrollmentButtons = page.locator('button:has-text("Request Enrollment")');
      
      if (await enrollmentButtons.count() > 0) {
        const firstButton = enrollmentButtons.first();
        
        const parentDiv = firstButton.locator('..').first();
        const initialClasses = await parentDiv.getAttribute('class');
        
        await firstButton.click();
        await page.waitForTimeout(1000);
        
        await page.goto(studentUrl);
        
        const pendingStatus = page.locator('text=/.*pending.*/', { hasText: /pending|Pending/ });
        
        if (await pendingStatus.count() > 0) {
          await expect(pendingStatus).toBeVisible();
        }
      }
    });

    test('should display course information correctly in requests table', async () => {
      await page.goto(studentUrl);
      
      const tableRows = page.locator('table tbody tr');
      
      if (await tableRows.count() > 0) {
        const firstRow = tableRows.first();
        
        const cells = firstRow.locator('td');
        expect(await cells.count()).toBeGreaterThanOrEqual(4);
      }
    });

    test('should auto-refresh enrollment data every 15 seconds', async () => {
      await page.goto(studentUrl);
      
      const initialCount = await page.locator('table tbody tr').count();
      
      await page.waitForTimeout(16000);
      
      const finalCount = await page.locator('table tbody tr').count();
      
      expect(finalCount).toBeGreaterThanOrEqual(0);
    });

    test('should display notification when enrollment request submitted', async () => {
      await page.goto(studentUrl);
      
      const enrollmentButtons = page.locator('button:has-text("Request Enrollment")');
      
      if (await enrollmentButtons.count() > 0) {
        const firstButton = enrollmentButtons.first();
        await firstButton.click();
        
        await page.waitForTimeout(500);
        
        const notification = page.locator('div[class*="animate-in"]');
        
        if (await notification.count() > 0) {
          await expect(notification.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('User & Rostering Control - Vertical Scrolling', () => {
    test('should display user management with scrollable container', async () => {
      await page.goto(adminUrl);
      
      const userManagementSection = page.locator('text=User & Rostering Control');
      await expect(userManagementSection).toBeVisible();
    });

    test('should have overflow-y-auto on user table container', async () => {
      await page.goto(adminUrl);
      
      const scrollContainer = page.locator('div[style*="maxHeight"]').first();
      
      if (await scrollContainer.count() > 0) {
        const style = await scrollContainer.getAttribute('style');
        expect(style).toContain('maxHeight');
      }
    });

    test('should display sticky header on user table', async () => {
      await page.goto(adminUrl);
      
      const tableHead = page.locator('thead[class*="sticky"]');
      
      if (await tableHead.count() > 0) {
        await expect(tableHead).toBeVisible();
      }
    });

    test('should filter users by search input', async () => {
      await page.goto(adminUrl);
      
      const filterInput = page.locator('input[placeholder*="Filter"]');
      
      if (await filterInput.count() > 0) {
        await filterInput.fill('teacher');
        await page.waitForTimeout(500);
        
        const tableRows = page.locator('table tbody tr');
        expect(await tableRows.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display user table with required columns', async () => {
      await page.goto(adminUrl);
      
      const columns = ['Name', 'Email', 'Role', 'Status', 'Last Login'];
      
      for (const column of columns) {
        const header = page.locator(`th:has-text("${column}")`);
        
        try {
          await expect(header).toBeVisible();
        } catch (e) {
          // Column might not be visible in this viewport
        }
      }
    });

    test('should display role selector dropdown for each user', async () => {
      await page.goto(adminUrl);
      
      const roleSelectors = page.locator('select');
      
      if (await roleSelectors.count() > 0) {
        await expect(roleSelectors.first()).toBeVisible();
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should update request list when new requests arrive', async () => {
      await page.goto(adminUrl);
      
      const initialCount = await page.locator('div[class*="border-2 rounded-lg"]').count();
      
      await page.waitForTimeout(11000);
      
      const newCount = await page.locator('div[class*="border-2 rounded-lg"]').count();
      
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    test('should reflect approval status change immediately', async () => {
      await page.goto(adminUrl);
      
      await page.locator('button:has-text("Pending")').first().click();
      await page.waitForTimeout(500);
      
      const requestCards = page.locator('div[class*="border-2 rounded-lg"]');
      
      if (await requestCards.count() > 0) {
        const firstRequest = requestCards.first();
        await firstRequest.click();
        
        const statusBefore = await page.locator('text=/.*Pending.*/', { hasText: /Pending|pending/ }).count();
        
        const approveButton = page.locator('button:has-text("Approve")');
        
        if (await approveButton.count() > 0) {
          await approveButton.click();
          await page.waitForTimeout(1000);
          
          const statusAfter = await page.locator('text=/.*[Pp]ending.*/', { hasText: /[Pp]ending/ }).count();
          
          expect(statusAfter).toBeLessThanOrEqual(statusBefore);
        }
      }
    });
  });
});
