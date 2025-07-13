import { test, expect } from './fixtures/test-fixtures';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto();
  });

  test('should require password for access', async ({ adminPage }) => {
    // Check login form is visible
    await expect(adminPage.adminPasswordInput).toBeVisible();
    await expect(adminPage.submitButton).toBeVisible();
    
    // Admin controls should be hidden
    await expect(adminPage.configSection).not.toBeVisible();
  });

  test('should login with correct password', async ({ adminPage }) => {
    await adminPage.login('dev123');
    
    // Check admin controls are now visible
    await expect(adminPage.configSection).toBeVisible();
    await expect(adminPage.playerStatsSection).toBeVisible();
  });

  test('should reject incorrect password', async ({ adminPage }) => {
    await adminPage.login('wrongpassword');
    
    // Should show error
    const errorMessage = adminPage.page.locator('[data-testid="login-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid password');
    
    // Admin controls should remain hidden
    await expect(adminPage.configSection).not.toBeVisible();
  });

  test('should set player resources', async ({ adminPage, gamePage }) => {
    await adminPage.login();
    
    // Set specific resources
    await adminPage.setResources(9999, 500, 85);
    
    // Verify in game
    await gamePage.goto();
    const gold = await gamePage.getGold();
    const population = await gamePage.getPopulation();
    const loyalty = await gamePage.getLoyalty();
    
    expect(gold).toBe(9999);
    expect(population).toBe(500);
    expect(loyalty).toBe(85);
  });

  test('should trigger specific events', async ({ adminPage, gamePage }) => {
    await adminPage.login();
    
    // Get available events from dropdown
    const options = await adminPage.eventSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    
    // Trigger first available event
    await adminPage.triggerEvent(options[1]); // Skip the default "Select event" option
    
    // Verify event appears in game
    await gamePage.goto();
    const isEventVisible = await gamePage.isEventVisible();
    expect(isEventVisible).toBe(true);
  });

  test('should display player statistics', async ({ adminPage, testData }) => {
    // Create some test players
    await testData.createMultipleUsers(5);
    
    await adminPage.login();
    
    // Check stats
    const activeCount = await adminPage.getActivePlayersCount();
    expect(activeCount).toBeGreaterThanOrEqual(5);
  });

  test('should export game data', async ({ adminPage }) => {
    await adminPage.login();
    
    // Export data
    const exportedData = await adminPage.exportGameData();
    const jsonData = JSON.parse(exportedData);
    
    // Verify exported data structure
    expect(jsonData).toHaveProperty('players');
    expect(jsonData).toHaveProperty('config');
    expect(jsonData).toHaveProperty('events');
    expect(jsonData).toHaveProperty('exportDate');
  });

  test('should import game data', async ({ adminPage }) => {
    await adminPage.login();
    
    // Create test data
    const testData = {
      players: [
        { id: 'test1', name: 'ImportedPlayer', gold: 5000, population: 50, loyalty: 60 }
      ],
      config: { eventFrequency: 'high' },
      events: [],
      exportDate: new Date().toISOString()
    };
    
    // Import data
    await adminPage.importGameData(JSON.stringify(testData));
    
    // Verify import success message
    const successMessage = adminPage.page.locator('[data-testid="import-success"]');
    await expect(successMessage).toBeVisible();
  });

  test('should update game configuration', async ({ adminPage }) => {
    await adminPage.login();
    
    // Update config values
    await adminPage.updateConfig('eventFrequency', 'high');
    await adminPage.updateConfig('passiveIncomeMultiplier', '2.5');
    
    // Verify values persisted
    const eventFreq = await adminPage.getConfigValue('eventFrequency');
    const incomeMulti = await adminPage.getConfigValue('passiveIncomeMultiplier');
    
    expect(eventFreq).toBe('high');
    expect(incomeMulti).toBe('2.5');
  });

  test('should reset all game data with confirmation', async ({ adminPage, gamePage }) => {
    await adminPage.login();
    
    // Create some game data first
    await adminPage.setResources(1000, 100, 70);
    
    // Reset all data
    await adminPage.resetAllData();
    
    // Verify reset
    await gamePage.goto();
    const gold = await gamePage.getGold();
    expect(gold).toBe(0); // Back to initial state
  });

  test('should show real-time event analytics', async ({ adminPage, gamePage }) => {
    await adminPage.login();
    
    const eventsBefore = await adminPage.getTotalEventsTriggered();
    
    // Trigger some events
    await adminPage.triggerEvent('merchant-visit');
    await gamePage.goto();
    await gamePage.selectEventOption(0);
    
    await adminPage.goto();
    const eventsAfter = await adminPage.getTotalEventsTriggered();
    
    expect(eventsAfter).toBe(eventsBefore + 1);
  });

  test('should validate resource input values', async ({ adminPage }) => {
    await adminPage.login();
    
    // Try invalid values
    await adminPage.goldInput.fill('-100');
    await adminPage.applyResourcesButton.click();
    
    // Should show validation error
    const errorMessage = adminPage.page.locator('[data-testid="validation-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Invalid value');
  });

  test('should persist admin session', async ({ adminPage }) => {
    await adminPage.login();
    
    // Reload page
    await adminPage.page.reload();
    
    // Should still be logged in
    const isLoggedIn = await adminPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });
});