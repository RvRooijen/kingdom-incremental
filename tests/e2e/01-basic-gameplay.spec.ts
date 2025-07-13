import { test, expect } from './fixtures/test-fixtures';

test.describe('Basic Gameplay', () => {
  test.beforeEach(async ({ gamePage }) => {
    await gamePage.goto();
  });

  test('should load the game with initial resources', async ({ gamePage }) => {
    // Check initial state
    const gold = await gamePage.getGold();
    const population = await gamePage.getPopulation();
    const loyalty = await gamePage.getLoyalty();

    expect(gold).toBe(0);
    expect(population).toBe(10);
    expect(loyalty).toBe(50);
  });

  test('should generate gold on click', async ({ gamePage }) => {
    const initialGold = await gamePage.getGold();
    
    // Click the gold button
    await gamePage.clickGoldButton();
    
    const newGold = await gamePage.getGold();
    expect(newGold).toBeGreaterThan(initialGold);
  });

  test('should generate gold based on click multiplier', async ({ gamePage }) => {
    // Click multiple times and verify gold increases
    const clicks = 10;
    const initialGold = await gamePage.getGold();
    
    await gamePage.clickGoldButton(clicks);
    
    const finalGold = await gamePage.getGold();
    expect(finalGold).toBeGreaterThan(initialGold);
    expect(finalGold).toBeGreaterThanOrEqual(clicks); // At least 1 gold per click
  });

  test('should show upgrade buttons when enough gold', async ({ gamePage }) => {
    // Generate some gold
    await gamePage.clickGoldButton(50);
    
    // Check if farm upgrade is available
    const isFarmAvailable = await gamePage.isUpgradeAvailable('farm');
    expect(isFarmAvailable).toBe(true);
  });

  test('should purchase upgrades and deduct gold', async ({ gamePage }) => {
    // Generate gold for upgrade
    await gamePage.clickGoldButton(100);
    
    const goldBefore = await gamePage.getGold();
    const upgradePrice = await gamePage.getUpgradePrice('farm');
    
    // Buy the upgrade
    await gamePage.buyUpgrade('farm');
    
    const goldAfter = await gamePage.getGold();
    expect(goldAfter).toBe(goldBefore - upgradePrice);
  });

  test('should increase population with farm upgrade', async ({ gamePage }) => {
    // Generate gold and buy farm
    await gamePage.clickGoldButton(100);
    
    const populationBefore = await gamePage.getPopulation();
    await gamePage.buyUpgrade('farm');
    
    // Wait for population update
    await gamePage.page.waitForTimeout(1000);
    
    const populationAfter = await gamePage.getPopulation();
    expect(populationAfter).toBeGreaterThan(populationBefore);
  });

  test('should save and load game state', async ({ gamePage }) => {
    // Generate some progress
    await gamePage.clickGoldButton(50);
    await gamePage.buyUpgrade('farm');
    
    const goldBefore = await gamePage.getGold();
    const populationBefore = await gamePage.getPopulation();
    
    // Save game
    await gamePage.saveGame();
    
    // Reset and verify reset worked
    await gamePage.resetGame();
    let goldAfterReset = await gamePage.getGold();
    expect(goldAfterReset).toBe(0);
    
    // Load game
    await gamePage.loadGame();
    
    const goldAfterLoad = await gamePage.getGold();
    const populationAfterLoad = await gamePage.getPopulation();
    
    expect(goldAfterLoad).toBe(goldBefore);
    expect(populationAfterLoad).toBe(populationBefore);
  });

  test('should auto-save periodically', async ({ gamePage }) => {
    // Generate some progress
    await gamePage.clickGoldButton(30);
    
    const goldBefore = await gamePage.getGold();
    
    // Wait for auto-save (usually every 30 seconds, but might be faster in test)
    await gamePage.waitForAutoSave();
    
    // Refresh page to simulate browser crash
    await gamePage.page.reload();
    
    const goldAfter = await gamePage.getGold();
    expect(goldAfter).toBe(goldBefore);
  });

  test('should disable upgrades when insufficient gold', async ({ gamePage }) => {
    // Start with no gold
    const gold = await gamePage.getGold();
    expect(gold).toBe(0);
    
    // Check that expensive upgrades are disabled
    const isMarketAvailable = await gamePage.isUpgradeAvailable('market');
    expect(isMarketAvailable).toBe(false);
  });

  test('should show upgrade prices', async ({ gamePage }) => {
    // Check that upgrade prices are displayed
    const farmPrice = await gamePage.getUpgradePrice('farm');
    expect(farmPrice).toBeGreaterThan(0);
    
    const marketPrice = await gamePage.getUpgradePrice('market');
    expect(marketPrice).toBeGreaterThan(farmPrice); // Market should be more expensive
  });
});