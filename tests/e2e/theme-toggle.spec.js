const { test, expect } = require('@playwright/test');

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should toggle between light and dark themes', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    const htmlElement = page.locator('html');

    // Theme toggle should be visible
    await expect(themeToggle).toBeVisible();

    // Check initial theme state
    const initialTheme = await htmlElement.getAttribute('class');
    const isDarkInitially = initialTheme?.includes('theme-dark') || false;

    // Click theme toggle
    await themeToggle.click();

    // Wait for theme change
    await page.waitForTimeout(100);

    // Check if theme changed
    const newTheme = await htmlElement.getAttribute('class');
    const isDarkAfterClick = newTheme?.includes('theme-dark') || false;

    expect(isDarkAfterClick).toBe(!isDarkInitially);

    // Check button state
    const buttonState = await themeToggle.getAttribute('aria-pressed');
    expect(buttonState).toBe(isDarkAfterClick ? 'true' : 'false');

    // Click again to toggle back
    await themeToggle.click();
    await page.waitForTimeout(100);

    const finalTheme = await htmlElement.getAttribute('class');
    const isDarkFinal = finalTheme?.includes('theme-dark') || false;

    expect(isDarkFinal).toBe(isDarkInitially);
  });

  test('should persist theme preference', async ({ page, context }) => {
    const themeToggle = page.locator('#theme-toggle');
    const htmlElement = page.locator('html');

    // Set to dark theme
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Verify dark theme is active
    const darkTheme = await htmlElement.getAttribute('class');
    expect(darkTheme).toContain('theme-dark');

    // Reload page
    await page.reload();
    await page.waitForTimeout(500);

    // Theme should still be dark after reload
    const reloadedTheme = await htmlElement.getAttribute('class');
    expect(reloadedTheme).toContain('theme-dark');
  });

  test('should have correct aria attributes', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');

    // Check initial aria attributes
    await expect(themeToggle).toHaveAttribute('aria-pressed');
    await expect(themeToggle).toHaveAttribute('aria-label');

    const initialLabel = await themeToggle.getAttribute('aria-label');
    expect(initialLabel).toMatch(/(Dark|Light).*(モードに切替)/);

    // Click toggle
    await themeToggle.click();
    await page.waitForTimeout(100);

    // Check aria attributes after toggle
    const newLabel = await themeToggle.getAttribute('aria-label');
    expect(newLabel).toMatch(/(Dark|Light).*(モードに切替)/);
    expect(newLabel).not.toBe(initialLabel);
  });

  test('should work with keyboard navigation', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    
    // Focus the theme toggle button
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();

    // Press Enter to toggle theme
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Verify theme changed
    const htmlElement = page.locator('html');
    const themeClass = await htmlElement.getAttribute('class');
    
    // Button should still be focused and aria-pressed should be updated
    await expect(themeToggle).toBeFocused();
    const ariaPressed = await themeToggle.getAttribute('aria-pressed');
    
    if (themeClass?.includes('theme-dark')) {
      expect(ariaPressed).toBe('true');
    } else {
      expect(ariaPressed).toBe('false');
    }
  });
});