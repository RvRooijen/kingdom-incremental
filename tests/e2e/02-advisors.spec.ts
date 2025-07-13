import { test, expect } from './fixtures/test-fixtures';

test.describe('Advisor System', () => {
  test.beforeEach(async ({ gamePage, testData }) => {
    await gamePage.goto();
    // Set up mid-game progress for advisor testing
    await testData.seedGameProgress('mid');
  });

  test('should unlock advisors at appropriate progress levels', async ({ gamePage }) => {
    // Check advisor section is visible
    await expect(gamePage.advisorSection).toBeVisible();
    
    // Verify treasurer is available first
    const treasurerButton = gamePage.page.locator('[data-testid="hire-treasurer"]');
    await expect(treasurerButton).toBeVisible();
  });

  test('should hire treasurer and increase passive gold income', async ({ gamePage }) => {
    // Record initial gold
    const initialGold = await gamePage.getGold();
    
    // Hire treasurer
    await gamePage.hireAdvisor('treasurer');
    
    // Wait for passive income
    await gamePage.page.waitForTimeout(5000);
    
    const newGold = await gamePage.getGold();
    expect(newGold).toBeGreaterThan(initialGold);
  });

  test('should hire general and improve military', async ({ gamePage }) => {
    // Hire general
    await gamePage.hireAdvisor('general');
    
    // Check for military bonuses (reduced upgrade costs, increased loyalty)
    const loyaltyBefore = await gamePage.getLoyalty();
    await gamePage.page.waitForTimeout(2000);
    const loyaltyAfter = await gamePage.getLoyalty();
    
    expect(loyaltyAfter).toBeGreaterThanOrEqual(loyaltyBefore);
  });

  test('should show advisor effects in UI', async ({ gamePage }) => {
    // Hire treasurer
    await gamePage.hireAdvisor('treasurer');
    
    // Check for advisor effect indicator
    const treasurerEffect = gamePage.page.locator('[data-testid="treasurer-effect"]');
    await expect(treasurerEffect).toBeVisible();
    await expect(treasurerEffect).toContainText('Gold per second');
  });

  test('should stack multiple advisor effects', async ({ gamePage, testData }) => {
    // Seed late game for multiple advisors
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Hire multiple advisors
    await gamePage.hireAdvisor('treasurer');
    await gamePage.hireAdvisor('architect');
    
    // Verify both effects are active
    const treasurerEffect = gamePage.page.locator('[data-testid="treasurer-effect"]');
    const architectEffect = gamePage.page.locator('[data-testid="architect-effect"]');
    
    await expect(treasurerEffect).toBeVisible();
    await expect(architectEffect).toBeVisible();
  });

  test('should unlock spymaster and reveal hidden information', async ({ gamePage, testData }) => {
    // Seed late game
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Hire spymaster
    await gamePage.hireAdvisor('spymaster');
    
    // Check for revealed information
    const hiddenStats = gamePage.page.locator('[data-testid="hidden-stats"]');
    await expect(hiddenStats).toBeVisible();
  });

  test('should show advisor requirements when locked', async ({ gamePage }) => {
    // Fresh game state
    await gamePage.resetGame();
    
    // Check locked advisor shows requirements
    const diplomatButton = gamePage.page.locator('[data-testid="hire-diplomat"]');
    const requirements = gamePage.page.locator('[data-testid="diplomat-requirements"]');
    
    await expect(diplomatButton).toBeDisabled();
    await expect(requirements).toBeVisible();
    await expect(requirements).toContainText('Requires');
  });

  test('should persist advisor effects after reload', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('mid');
    await gamePage.goto();
    
    // Hire advisor
    await gamePage.hireAdvisor('treasurer');
    
    // Save and reload
    await gamePage.saveGame();
    await gamePage.page.reload();
    
    // Verify advisor is still active
    const treasurerEffect = gamePage.page.locator('[data-testid="treasurer-effect"]');
    await expect(treasurerEffect).toBeVisible();
  });

  test('should apply diplomat bonus to loyalty', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Record loyalty before diplomat
    const loyaltyBefore = await gamePage.getLoyalty();
    
    // Hire diplomat
    await gamePage.hireAdvisor('diplomat');
    
    // Check loyalty increase
    await gamePage.page.waitForTimeout(1000);
    const loyaltyAfter = await gamePage.getLoyalty();
    
    expect(loyaltyAfter).toBeGreaterThan(loyaltyBefore);
  });

  test('should show advisor synergies', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Hire complementary advisors
    await gamePage.hireAdvisor('treasurer');
    await gamePage.hireAdvisor('architect');
    
    // Check for synergy bonus
    const synergyIndicator = gamePage.page.locator('[data-testid="advisor-synergy"]');
    await expect(synergyIndicator).toBeVisible();
    await expect(synergyIndicator).toContainText('Synergy Bonus');
  });
});