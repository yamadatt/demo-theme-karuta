const { test, expect } = require('@playwright/test');

test.describe('Basic Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads without errors
    await expect(page).toHaveTitle(/.*karuta.*/i);
    
    // Check for basic page structure
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // Check for no JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('should have working mobile navigation toggle', async ({ page }) => {
    // Test mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for page to load and elements to be ready
    await page.waitForLoadState('networkidle');

    const navToggle = page.locator('#nav-toggle');
    const primaryNav = page.locator('#primary-nav');

    // Navigation toggle should be visible on mobile
    await expect(navToggle).toBeVisible();
    
    // Initial state - navigation should be closed
    await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open navigation
    await navToggle.click();
    await expect(navToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(primaryNav).toHaveClass(/is-open/);

    // Click to close navigation
    await navToggle.click();
    await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(primaryNav).not.toHaveClass(/is-open/);
  });

  test('should hide mobile navigation on desktop', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');

    const navToggle = page.locator('#nav-toggle');
    
    // Navigation toggle should be hidden on desktop
    await expect(navToggle).toBeHidden();
  });

  test('should close navigation after clicking a link', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const navToggle = page.locator('#nav-toggle');
    const primaryNav = page.locator('#primary-nav');

    // Open navigation
    await navToggle.click();
    await expect(navToggle).toHaveAttribute('aria-expanded', 'true');

    // Click on a navigation link (if exists)
    const navLink = primaryNav.locator('a').first();
    if (await navLink.count() > 0) {
      await navLink.click();
      // Navigation should close after clicking link
      await expect(navToggle).toHaveAttribute('aria-expanded', 'false');
    }
  });
});