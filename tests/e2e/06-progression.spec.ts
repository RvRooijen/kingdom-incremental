import { test, expect } from './fixtures/test-fixtures';

test.describe('Game Progression', () => {
  test('should unlock upgrades in correct order', async ({ gamePage }) => {
    await gamePage.goto();
    
    // Initially only farm should be visible
    const farmButton = gamePage.page.locator('[data-testid="upgrade-farm"]');
    const marketButton = gamePage.page.locator('[data-testid="upgrade-market"]');
    const blacksmithButton = gamePage.page.locator('[data-testid="upgrade-blacksmith"]');
    
    await expect(farmButton).toBeVisible();
    await expect(marketButton).not.toBeVisible();
    await expect(blacksmithButton).not.toBeVisible();
    
    // Buy farm
    await gamePage.clickGoldButton(100);
    await gamePage.buyUpgrade('farm');
    
    // Now market should be visible
    await expect(marketButton).toBeVisible();
  });

  test('should increase upgrade prices with each purchase', async ({ gamePage }) => {
    await gamePage.goto();
    
    // Get initial farm price
    const initialPrice = await gamePage.getUpgradePrice('farm');
    
    // Buy farm
    await gamePage.clickGoldButton(200);
    await gamePage.buyUpgrade('farm');
    
    // Check new price is higher
    const newPrice = await gamePage.getUpgradePrice('farm');
    expect(newPrice).toBeGreaterThan(initialPrice);
    expect(newPrice).toBe(Math.floor(initialPrice * 1.15)); // Typical incremental multiplier
  });

  test('should unlock milestones at specific thresholds', async ({ gamePage, testData }) => {
    // Start with mid-game progress
    await testData.seedGameProgress('mid');
    await gamePage.goto();
    
    // Check for milestone notifications
    const milestoneNotification = gamePage.page.locator('[data-testid="milestone-notification"]');
    
    // Reach a milestone (e.g., 100 population)
    const population = await gamePage.getPopulation();
    if (population >= 100) {
      await expect(milestoneNotification).toBeVisible();
      await expect(milestoneNotification).toContainText('100 Population');
    }
  });

  test('should apply prestige bonuses', async ({ gamePage, testData }) => {
    // Set up late game for prestige
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Check if prestige is available
    const prestigeButton = gamePage.page.locator('[data-testid="prestige-button"]');
    
    if (await prestigeButton.isVisible()) {
      // Get current multipliers
      const goldPerClick = gamePage.page.locator('[data-testid="gold-per-click"]');
      const baseValue = await goldPerClick.textContent();
      
      // Prestige
      await prestigeButton.click();
      await gamePage.page.locator('[data-testid="confirm-prestige"]').click();
      
      // Wait for reset
      await gamePage.page.waitForTimeout(1000);
      
      // Check prestige bonus applied
      const newValue = await goldPerClick.textContent();
      expect(parseInt(newValue || '1')).toBeGreaterThan(parseInt(baseValue || '1'));
    }
  });

  test('should track achievement progress', async ({ gamePage }) => {
    await gamePage.goto();
    
    // Open achievements panel
    const achievementsButton = gamePage.page.locator('[data-testid="achievements-button"]');
    await achievementsButton.click();
    
    // Check achievement list
    const achievements = await gamePage.page.locator('[data-testid="achievement-item"]').all();
    expect(achievements.length).toBeGreaterThan(0);
    
    // Find "First Gold" achievement
    const firstGoldAchievement = gamePage.page.locator('[data-testid="achievement-first-gold"]');
    const progressBefore = await firstGoldAchievement.getAttribute('data-progress');
    
    // Earn gold
    await gamePage.page.locator('[data-testid="close-achievements"]').click();
    await gamePage.clickGoldButton();
    
    // Check achievement completed
    await achievementsButton.click();
    const progressAfter = await firstGoldAchievement.getAttribute('data-progress');
    expect(progressAfter).toBe('100');
  });

  test('should calculate offline progress', async ({ gamePage, testData }) => {
    // Set up game with passive income
    await testData.seedGameProgress('mid');
    await gamePage.goto();
    
    const goldBefore = await gamePage.getGold();
    
    // Simulate being offline
    await testData.simulateTimePassing(5); // 5 minutes offline
    
    // Reload to trigger offline calculation
    await gamePage.page.reload();
    
    // Check offline earnings popup
    const offlinePopup = gamePage.page.locator('[data-testid="offline-earnings-popup"]');
    await expect(offlinePopup).toBeVisible();
    
    const goldAfter = await gamePage.getGold();
    expect(goldAfter).toBeGreaterThan(goldBefore);
  });

  test('should show progression indicators', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('mid');
    await gamePage.goto();
    
    // Check various progression indicators
    const progressBar = gamePage.page.locator('[data-testid="overall-progress-bar"]');
    await expect(progressBar).toBeVisible();
    
    const progressPercent = await progressBar.getAttribute('data-percent');
    expect(parseInt(progressPercent || '0')).toBeGreaterThan(0);
    
    // Check era indicator
    const eraIndicator = gamePage.page.locator('[data-testid="current-era"]');
    await expect(eraIndicator).toBeVisible();
    await expect(eraIndicator).toContainText('Medieval'); // Or whatever era corresponds to mid-game
  });

  test('should unlock new mechanics at progression milestones', async ({ gamePage, testData }) => {
    // Early game - basic clicking
    await gamePage.goto();
    const automationTab = gamePage.page.locator('[data-testid="automation-tab"]');
    await expect(automationTab).not.toBeVisible();
    
    // Mid game - automation unlocked
    await testData.seedGameProgress('mid');
    await gamePage.page.reload();
    await expect(automationTab).toBeVisible();
    
    // Late game - prestige unlocked
    await testData.seedGameProgress('late');
    await gamePage.page.reload();
    const prestigeTab = gamePage.page.locator('[data-testid="prestige-tab"]');
    await expect(prestigeTab).toBeVisible();
  });

  test('should display resource generation rates', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('mid');
    await gamePage.goto();
    
    // Check rate displays
    const goldRate = gamePage.page.locator('[data-testid="gold-per-second"]');
    const populationRate = gamePage.page.locator('[data-testid="population-growth-rate"]');
    
    await expect(goldRate).toBeVisible();
    await expect(populationRate).toBeVisible();
    
    // Rates should be positive with upgrades
    const goldRateValue = await goldRate.textContent();
    expect(parseFloat(goldRateValue || '0')).toBeGreaterThan(0);
  });

  test('should handle exponential growth properly', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Check for scientific notation on large numbers
    const gold = await gamePage.getGold();
    const goldDisplay = await gamePage.goldCounter.textContent();
    
    if (gold > 1000000) {
      expect(goldDisplay).toMatch(/[0-9.]+[MBT]/); // Shortened notation
    }
  });
});