import { test, expect } from './fixtures/test-fixtures';

test.describe('Leaderboard System', () => {
  test.beforeEach(async ({ gamePage, testData }) => {
    await gamePage.goto();
    
    // Seed leaderboard with test data
    await testData.seedLeaderboard([
      { name: 'TopPlayer', score: 1000000 },
      { name: 'MidPlayer', score: 50000 },
      { name: 'Beginner', score: 1000 }
    ]);
  });

  test('should display leaderboard with top players', async ({ gamePage }) => {
    await gamePage.openLeaderboard();
    
    const entries = await gamePage.getLeaderboardEntries();
    expect(entries).toHaveLength(3);
    expect(entries[0].name).toBe('TopPlayer');
    expect(entries[0].score).toBe(1000000);
  });

  test('should sort leaderboard by score descending', async ({ gamePage }) => {
    await gamePage.openLeaderboard();
    
    const entries = await gamePage.getLeaderboardEntries();
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1].score).toBeGreaterThanOrEqual(entries[i].score);
    }
  });

  test('should update leaderboard with current player score', async ({ gamePage }) => {
    // Generate high score
    await gamePage.clickGoldButton(1000);
    
    // Open leaderboard
    await gamePage.openLeaderboard();
    
    // Current player should be highlighted
    const currentPlayer = gamePage.page.locator('[data-testid="current-player-entry"]');
    await expect(currentPlayer).toBeVisible();
    await expect(currentPlayer).toHaveClass(/highlighted/);
  });

  test('should show player rank', async ({ gamePage, testData }) => {
    // Create player with specific score
    await testData.createTestUser({
      name: 'TestPlayer',
      gameState: { gold: 25000, population: 250, loyalty: 80, upgrades: [], advisors: [] }
    });
    
    await gamePage.goto();
    await gamePage.openLeaderboard();
    
    // Check rank display
    const rankDisplay = gamePage.page.locator('[data-testid="player-rank"]');
    await expect(rankDisplay).toBeVisible();
    await expect(rankDisplay).toContainText('#4'); // Should be 4th with 25000 gold
  });

  test('should limit leaderboard entries', async ({ gamePage, testData }) => {
    // Add many players
    await testData.createMultipleUsers(20, {
      gameState: { gold: Math.floor(Math.random() * 100000), population: 100, loyalty: 50, upgrades: [], advisors: [] }
    });
    
    await gamePage.goto();
    await gamePage.openLeaderboard();
    
    const entries = await gamePage.getLeaderboardEntries();
    expect(entries.length).toBeLessThanOrEqual(10); // Usually top 10
  });

  test('should refresh leaderboard periodically', async ({ gamePage, testData }) => {
    await gamePage.openLeaderboard();
    
    const entriesBefore = await gamePage.getLeaderboardEntries();
    
    // Add new high score player
    await testData.createTestUser({
      name: 'NewChampion',
      gameState: { gold: 2000000, population: 2000, loyalty: 95, upgrades: [], advisors: [] }
    });
    
    // Wait for refresh (usually 30 seconds, might be faster in test)
    await gamePage.page.waitForTimeout(5000);
    
    const entriesAfter = await gamePage.getLeaderboardEntries();
    expect(entriesAfter[0].name).toBe('NewChampion');
  });

  test('should close leaderboard modal', async ({ gamePage }) => {
    await gamePage.openLeaderboard();
    await expect(gamePage.leaderboardModal).toBeVisible();
    
    await gamePage.closeLeaderboard();
    await expect(gamePage.leaderboardModal).not.toBeVisible();
  });

  test('should show achievement badges for top players', async ({ gamePage }) => {
    await gamePage.openLeaderboard();
    
    // Check for badges on top 3
    const goldBadge = gamePage.page.locator('[data-testid="rank-badge-1"]');
    const silverBadge = gamePage.page.locator('[data-testid="rank-badge-2"]');
    const bronzeBadge = gamePage.page.locator('[data-testid="rank-badge-3"]');
    
    await expect(goldBadge).toBeVisible();
    await expect(silverBadge).toBeVisible();
    await expect(bronzeBadge).toBeVisible();
  });

  test('should display player statistics in leaderboard', async ({ gamePage }) => {
    await gamePage.openLeaderboard();
    
    // Click on a player for details
    const firstEntry = gamePage.page.locator('[data-testid="leaderboard-entry"]').first();
    await firstEntry.click();
    
    // Check stats popup
    const statsPopup = gamePage.page.locator('[data-testid="player-stats-popup"]');
    await expect(statsPopup).toBeVisible();
    await expect(statsPopup).toContainText('Population');
    await expect(statsPopup).toContainText('Loyalty');
    await expect(statsPopup).toContainText('Upgrades');
  });

  test('should filter leaderboard by time period', async ({ gamePage }) => {
    await gamePage.openLeaderboard();
    
    // Check for time filter options
    const dailyFilter = gamePage.page.locator('[data-testid="filter-daily"]');
    const weeklyFilter = gamePage.page.locator('[data-testid="filter-weekly"]');
    const allTimeFilter = gamePage.page.locator('[data-testid="filter-alltime"]');
    
    await expect(dailyFilter).toBeVisible();
    await expect(weeklyFilter).toBeVisible();
    await expect(allTimeFilter).toBeVisible();
    
    // Switch to daily
    await dailyFilter.click();
    
    // Verify leaderboard updated
    const dailyLabel = gamePage.page.locator('[data-testid="leaderboard-period"]');
    await expect(dailyLabel).toContainText('Daily');
  });
});