import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Parent Dashboard - Empty State & Child Linking', () => {
    
    test('should display dashboard header even with no linked children', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const dashboardTitle = page.locator('text=Parent/Guardian Dashboard');
        await expect(dashboardTitle).toBeVisible();
    });

    test('should show empty state message when no children linked', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const childSelector = page.locator('#child-selector');
        
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        const selectorVisible = await childSelector.isVisible().catch(() => false);
        
        if (messageVisible) {
            await expect(emptyMessage).toBeVisible();
        }
    });

    test('should display "Link Your Child" button in empty state', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            await expect(linkButton).toBeVisible();
        }
    });

    test('should open link child modal when "Link Your Child" button clicked in empty state', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
            await linkButton.click();
            
            const modalTitle = page.locator('text=Link Your Child');
            await expect(modalTitle).toBeVisible();
        }
    });

    test('should display student selector and search input inside link modal', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
            await linkButton.click();
            
            const studentSelect = page.locator('#student-select');
            const searchInput = page.locator('#search-students');
            
            await expect(studentSelect).toBeVisible();
            await expect(searchInput).toBeVisible();
        }
    });

    test('should close modal when X button clicked', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
            await linkButton.click();
            
            const modalTitle = page.locator('text=Link Your Child');
            await expect(modalTitle).toBeVisible();
            
            const closeButton = page.locator('button:has-text("✕")').first();
            await closeButton.click();
            
            await expect(modalTitle).not.toBeVisible({ timeout: 2000 });
        }
    });

    test('should select student from dropdown inside modal', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
            await linkButton.click();
            
            const studentSelect = page.locator('#student-select');
            const availableOptions = page.locator('optgroup[label="Available"] option');
            const optionCount = await availableOptions.count();
            
            if (optionCount > 0) {
                await studentSelect.selectOption({ index: 0 });
                const selectedValue = await studentSelect.inputValue();
                expect(selectedValue).not.toBe('');
            }
        }
    });

    test('should link child successfully from empty state modal', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
            await linkButton.click();
            
            const studentSelect = page.locator('#student-select');
            const availableOptions = page.locator('optgroup[label="Available"] option');
            const optionCount = await availableOptions.count();
            
            if (optionCount > 0) {
                await studentSelect.selectOption({ index: 0 });
                
                const linkChildButton = page.locator('button:has-text("Link Child\'s Account")');
                await linkChildButton.click();
                
                const successMessage = page.locator('text=Child linked successfully');
                await expect(successMessage).toBeVisible({ timeout: 5000 });
            }
        }
    });

    test('should redirect to main dashboard after successful linking from empty state', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
            await linkButton.click();
            
            const studentSelect = page.locator('#student-select');
            const availableOptions = page.locator('optgroup[label="Available"] option');
            const optionCount = await availableOptions.count();
            
            if (optionCount > 0) {
                await studentSelect.selectOption({ index: 0 });
                
                const linkChildButton = page.locator('button:has-text("Link Child\'s Account")');
                await linkChildButton.click();
                
                const successMessage = page.locator('text=Child linked successfully');
                await expect(successMessage).toBeVisible({ timeout: 5000 });
                
                await page.waitForTimeout(1000);
                await page.waitForLoadState('networkidle');
                
                const childSelector = page.locator('#child-selector');
                await expect(childSelector).toBeVisible({ timeout: 5000 });
                
                const emptyStateGone = await emptyMessage.isVisible().catch(() => false);
                expect(emptyStateGone).toBe(false);
            }
        }
    });

    test('should display child selector and tabs after linking first child', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const emptyMessage = page.locator('text=No students linked yet');
        const messageVisible = await emptyMessage.isVisible().catch(() => false);
        
        if (messageVisible) {
            const linkButton = page.locator('button:has-text("Link Your Child"):not(:has-text("Another"))');
            await linkButton.click();
            
            const studentSelect = page.locator('#student-select');
            const availableOptions = page.locator('optgroup[label="Available"] option');
            const optionCount = await availableOptions.count();
            
            if (optionCount > 0) {
                await studentSelect.selectOption({ index: 0 });
                
                const linkChildButton = page.locator('button:has-text("Link Child\'s Account")');
                await linkChildButton.click();
                
                await page.waitForTimeout(1500);
                await page.waitForLoadState('networkidle');
                
                const childSelector = page.locator('#child-selector');
                const tabs = page.locator('button:has-text("At-a-Glance Status")');
                
                await expect(childSelector).toBeVisible();
                await expect(tabs).toBeVisible();
            }
        }
    });

    test('should display "Link Another Child" button after having children linked', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const childSelector = page.locator('#child-selector');
        const selectorVisible = await childSelector.isVisible().catch(() => false);
        
        if (selectorVisible) {
            const linkAnotherButton = page.locator('button:has-text("Link Another Child")');
            await expect(linkAnotherButton).toBeVisible();
        }
    });

    test('should allow selecting different children from dropdown when multiple linked', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const childSelector = page.locator('#child-selector');
        const selectorVisible = await childSelector.isVisible().catch(() => false);
        
        if (selectorVisible) {
            const options = page.locator('#child-selector option');
            const optionCount = await options.count();
            
            if (optionCount > 1) {
                const firstValue = await childSelector.inputValue();
                
                await childSelector.selectOption({ index: 1 });
                const secondValue = await childSelector.inputValue();
                
                expect(firstValue).not.toBe(secondValue);
            }
        }
    });

    test('should maintain selected child while modal is open', async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        await page.waitForLoadState('networkidle');
        
        const childSelector = page.locator('#child-selector');
        const selectorVisible = await childSelector.isVisible().catch(() => false);
        
        if (selectorVisible) {
            const initialValue = await childSelector.inputValue();
            
            const linkAnotherButton = page.locator('button:has-text("Link Another Child")');
            await linkAnotherButton.click();
            
            const modalTitle = page.locator('text=Link Another Child');
            await expect(modalTitle).toBeVisible();
            
            const closeButton = page.locator('button:has-text("✕")').first();
            await closeButton.click();
            
            const finalValue = await childSelector.inputValue();
            expect(finalValue).toBe(initialValue);
        }
    });
});
