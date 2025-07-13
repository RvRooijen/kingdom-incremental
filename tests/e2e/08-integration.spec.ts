import { test, expect } from './fixtures/test-fixtures';

test.describe('Integration Tests', () => {
  test('should complete full game loop from start to prestige', async ({ gamePage, testData }) => {
    await gamePage.goto();
    
    // Early game - manual clicking
    await gamePage.clickGoldButton(50);
    await gamePage.buyUpgrade('farm');
    
    // Verify population growth
    await gamePage.page.waitForTimeout(2000);
    const population = await gamePage.getPopulation();
    expect(population).toBeGreaterThan(10);
    
    // Progress to mid game
    await testData.setGameSpeed(100); // Speed up for testing
    await gamePage.clickGoldButton(200);
    await gamePage.buyUpgrade('market');
    await gamePage.buyUpgrade('blacksmith');
    
    // Hire first advisor
    await gamePage.hireAdvisor('treasurer');
    
    // Wait for passive income
    await gamePage.page.waitForTimeout(3000);
    const passiveGold = await gamePage.getGold();
    expect(passiveGold).toBeGreaterThan(1000);
    
    // Handle an event
    const adminPage = await gamePage.page.context().newPage();
    const admin = new (await import('./helpers/AdminPage')).AdminPage(adminPage);
    await admin.goto();
    await admin.login();
    await admin.triggerEvent('trade-caravan');
    await adminPage.close();
    
    await gamePage.page.bringToFront();
    await gamePage.selectEventOption(0);
    
    // Progress to late game
    await testData.seedGameProgress('late');
    await gamePage.page.reload();
    
    // Check prestige availability
    const prestigeButton = gamePage.page.locator('[data-testid="prestige-button"]');
    await expect(prestigeButton).toBeVisible();
  });

  test('should synchronize game state across multiple tabs', async ({ browser, testData }) => {
    // Create first tab
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    const gamePage1 = new (await import('./helpers/GamePage')).GamePage(page1);
    
    await gamePage1.goto();
    await gamePage1.clickGoldButton(100);
    
    // Create second tab
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    const gamePage2 = new (await import('./helpers/GamePage')).GamePage(page2);
    
    await gamePage2.goto();
    
    // Gold should be synchronized
    const gold1 = await gamePage1.getGold();
    const gold2 = await gamePage2.getGold();
    expect(gold2).toBe(gold1);
    
    // Make change in tab 2
    await gamePage2.clickGoldButton(50);
    
    // Tab 1 should update
    await page1.waitForTimeout(1000);
    const newGold1 = await gamePage1.getGold();
    expect(newGold1).toBe(gold1 + 50);
    
    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('should handle save corruption gracefully', async ({ gamePage }) => {
    await gamePage.goto();
    
    // Create some progress
    await gamePage.clickGoldButton(100);
    await gamePage.saveGame();
    
    // Corrupt the save data
    await gamePage.page.evaluate(() => {
      localStorage.setItem('kingdom-save', 'corrupted-data-{}[]');
    });
    
    // Reload should handle corruption
    await gamePage.page.reload();
    
    // Should show error message
    const errorMessage = gamePage.page.locator('[data-testid="save-error"]');
    await expect(errorMessage).toBeVisible();
    
    // Should allow starting fresh
    const startFreshButton = gamePage.page.locator('[data-testid="start-fresh"]');
    await startFreshButton.click();
    
    // Game should work normally
    await gamePage.clickGoldButton();
    const gold = await gamePage.getGold();
    expect(gold).toBeGreaterThan(0);
  });

  test('should maintain game balance through progression', async ({ gamePage, testData }) => {
    // Test economic balance at different stages
    const stages = ['early', 'mid', 'late'] as const;
    
    for (const stage of stages) {
      await testData.seedGameProgress(stage);
      await gamePage.goto();
      
      // Record income rate
      const goldBefore = await gamePage.getGold();
      await gamePage.page.waitForTimeout(10000);
      const goldAfter = await gamePage.getGold();
      
      const incomeRate = (goldAfter - goldBefore) / 10; // Gold per second
      
      // Verify balanced progression
      switch (stage) {
        case 'early':
          expect(incomeRate).toBeLessThan(10);
          break;
        case 'mid':
          expect(incomeRate).toBeBetween(10, 1000);
          break;
        case 'late':
          expect(incomeRate).toBeGreaterThan(1000);
          break;
      }
    }
  });

  test('should integrate all game systems seamlessly', async ({ gamePage, adminPage, testData }) => {
    // Set up mid-game state
    await testData.seedGameProgress('mid');
    await gamePage.goto();
    
    // Test upgrade + advisor synergy
    await gamePage.buyUpgrade('temple');
    await gamePage.hireAdvisor('diplomat');
    
    // Loyalty should increase from both
    const loyaltyBefore = await gamePage.getLoyalty();
    await gamePage.page.waitForTimeout(2000);
    const loyaltyAfter = await gamePage.getLoyalty();
    expect(loyaltyAfter).toBeGreaterThan(loyaltyBefore);
    
    // Test event + loyalty interaction
    await adminPage.goto();
    await adminPage.login();
    await adminPage.triggerEvent('loyalty-test');
    
    await gamePage.goto();
    
    // High loyalty should give more options
    const optionCount = await gamePage.eventOptions.count();
    expect(optionCount).toBeGreaterThanOrEqual(2);
    
    // Test achievement + leaderboard integration
    await gamePage.selectEventOption(0);
    
    // Check achievement unlocked
    const achievementNotification = gamePage.page.locator('[data-testid="achievement-unlocked"]');
    await expect(achievementNotification).toBeVisible();
    
    // Check leaderboard updated
    await gamePage.openLeaderboard();
    const currentPlayer = gamePage.page.locator('[data-testid="current-player-entry"]');
    await expect(currentPlayer).toBeVisible();
  });

  test('should handle edge cases in game mechanics', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Test zero population
    await adminPage.setResources(1000, 0, 50);
    await gamePage.goto();
    
    // Should prevent game-breaking state
    const population = await gamePage.getPopulation();
    expect(population).toBeGreaterThanOrEqual(1); // Minimum population
    
    // Test maximum values
    await adminPage.goto();
    await adminPage.setResources(Number.MAX_SAFE_INTEGER, 999999, 100);
    
    await gamePage.goto();
    
    // Should display properly
    const goldDisplay = await gamePage.goldCounter.textContent();
    expect(goldDisplay).not.toContain('NaN');
    expect(goldDisplay).not.toContain('Infinity');
    
    // Test negative loyalty
    await adminPage.goto();
    await adminPage.setResources(1000, 100, -10);
    
    await gamePage.goto();
    const loyalty = await gamePage.getLoyalty();
    expect(loyalty).toBeGreaterThanOrEqual(0); // Should clamp to 0
  });

  test('should provide smooth mobile experience', async ({ browser }) => {
    // Create mobile context
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 12 dimensions
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      hasTouch: true,
      isMobile: true
    });
    
    const page = await context.newPage();
    const gamePage = new (await import('./helpers/GamePage')).GamePage(page);
    
    await gamePage.goto();
    
    // Test touch interactions
    await gamePage.clickButton.tap();
    const gold = await gamePage.getGold();
    expect(gold).toBeGreaterThan(0);
    
    // Test responsive layout
    const upgradeSection = gamePage.page.locator('[data-testid="upgrade-section"]');
    await expect(upgradeSection).toBeVisible();
    
    // Test swipe gestures for navigation
    const body = gamePage.page.locator('body');
    const box = await body.boundingBox();
    if (box) {
      await gamePage.page.mouse.move(box.x + box.width - 50, box.y + box.height / 2);
      await gamePage.page.mouse.down();
      await gamePage.page.mouse.move(box.x + 50, box.y + box.height / 2);
      await gamePage.page.mouse.up();
    }
    
    // Verify navigation worked
    const advisorTab = gamePage.page.locator('[data-testid="advisor-tab"]');
    await expect(advisorTab).toHaveClass(/active/);
    
    await context.close();
  });
});