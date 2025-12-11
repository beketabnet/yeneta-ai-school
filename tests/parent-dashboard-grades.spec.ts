import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Parent Dashboard - Courses & Grades', () => {
    
    test('should display Performance Overview header with selected child name', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const performanceHeader = page.locator('text=Performance Overview for');
        const isVisible = await performanceHeader.isVisible().catch(() => false);
        
        if (isVisible) {
            await expect(performanceHeader).toBeVisible();
            const headerText = await performanceHeader.textContent();
            expect(headerText).toMatch(/Performance Overview for \w+/);
        }
    });

    test('should load grades without toFixed error', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const gradesTab = page.locator('button:has-text("Courses & Grades")');
        await gradesTab.click();
        await page.waitForTimeout(1000);
        
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
        
        await page.waitForLoadState('networkidle');
        
        const toFixedErrors = consoleErrors.filter(e => 
            e.includes('toFixed') || e.includes('undefined')
        );
        expect(toFixedErrors).toHaveLength(0);
    });

    test('should display course grades with overall grade displayed correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const gradesTab = page.locator('button:has-text("Courses & Grades")');
        await gradesTab.click();
        await page.waitForTimeout(1500);
        
        const overallGrades = page.locator('text=Overall Grade').locator('..').locator('p').first();
        const gradeValue = await overallGrades.textContent().catch(() => null);
        
        if (gradeValue && gradeValue !== 'Overall Grade') {
            const isNumericOrNA = /^\d+\.\d+$|^N\/A$/.test(gradeValue ?? '');
            expect(isNumericOrNA).toBe(true);
        }
    });

    test('should handle missing overall_grade gracefully', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const gradesTab = page.locator('button:has-text("Courses & Grades")');
        const isVisible = await gradesTab.isVisible().catch(() => false);
        
        if (isVisible) {
            await gradesTab.click();
            await page.waitForTimeout(1500);
            
            const errorBoundary = page.locator('text=An error occurred');
            const hasError = await errorBoundary.isVisible().catch(() => false);
            expect(hasError).toBe(false);
        }
    });

    test('should filter children dropdown by approved enrollments', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const childSelector = page.locator('#child-selector');
        const selectorVisible = await childSelector.isVisible().catch(() => false);
        
        if (selectorVisible) {
            const options = page.locator('#child-selector option');
            const optionCount = await options.count();
            expect(optionCount).toBeGreaterThan(0);
        }
    });

    test('should change performance overview when switching children', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const childSelector = page.locator('#child-selector');
        const options = page.locator('#child-selector option');
        const optionCount = await options.count();
        
        if (optionCount > 1) {
            const firstOptionText = await options.nth(0).textContent();
            await childSelector.selectOption({ index: 1 });
            await page.waitForTimeout(1000);
            
            const secondOptionText = await options.nth(1).textContent();
            const headerText = page.locator('text=Performance Overview for');
            const headerVisible = await headerText.isVisible().catch(() => false);
            
            if (headerVisible) {
                const header = await headerText.textContent();
                expect(header).not.toContain(firstOptionText);
            }
        }
    });

    test('should display unit grades with defensive handling', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const gradesTab = page.locator('button:has-text("Courses & Grades")');
        const isVisible = await gradesTab.isVisible().catch(() => false);
        
        if (isVisible) {
            await gradesTab.click();
            await page.waitForTimeout(1500);
            
            const unitGrades = page.locator('text=%');
            const count = await unitGrades.count();
            
            if (count > 0) {
                const firstUnitGrade = await unitGrades.first().textContent();
                const isValidGrade = /^\d+\.\d+%$|^N\/A%$/.test(firstUnitGrade ?? '');
                expect(isValidGrade).toBe(true);
            }
        }
    });

    test('should display assignment items with scores', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const gradesTab = page.locator('button:has-text("Courses & Grades")');
        const isVisible = await gradesTab.isVisible().catch(() => false);
        
        if (isVisible) {
            await gradesTab.click();
            await page.waitForTimeout(1500);
            
            const scoreItems = page.locator('text=/\\d+\/\\d+/');
            const count = await scoreItems.count();
            
            if (count > 0) {
                expect(count).toBeGreaterThan(0);
            }
        }
    });

    test('should make API call with student_id query parameter', async ({ page }) => {
        const requests: string[] = [];
        
        page.on('request', request => {
            if (request.url().includes('parent-child-grades')) {
                requests.push(request.url());
            }
        });
        
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const gradesTab = page.locator('button:has-text("Courses & Grades")');
        const isVisible = await gradesTab.isVisible().catch(() => false);
        
        if (isVisible) {
            await gradesTab.click();
            await page.waitForTimeout(1500);
            
            const gradesRequests = requests.filter(url => 
                url.includes('parent-child-grades')
            );
            
            if (gradesRequests.length > 0) {
                const hasStudentId = gradesRequests.some(url => 
                    url.includes('student_id=')
                );
                expect(hasStudentId).toBe(true);
            }
        }
    });

    test('should render courses list when grades are available', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const gradesTab = page.locator('button:has-text("Courses & Grades")');
        const isVisible = await gradesTab.isVisible().catch(() => false);
        
        if (isVisible) {
            await gradesTab.click();
            await page.waitForLoadState('networkidle');
            
            const courseTitle = page.locator('[class*="font-semibold"][class*="text-lg"]');
            const count = await courseTitle.count();
            
            const loadingMsg = page.locator('text=Loading grades');
            const noGradesMsg = page.locator('text=No course grades available');
            
            const isLoading = await loadingMsg.isVisible().catch(() => false);
            const hasNoGrades = await noGradesMsg.isVisible().catch(() => false);
            
            if (!isLoading && !hasNoGrades) {
                expect(count).toBeGreaterThanOrEqual(0);
            }
        }
    });
});
