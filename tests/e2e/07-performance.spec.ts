import { test, expect } from './fixtures/test-fixtures';

test.describe('Performance Tests', () => {
  test('should handle rapid clicking without lag', async ({ gamePage }) => {
    await gamePage.goto();
    
    // Measure time for 100 rapid clicks
    const startTime = Date.now();
    await gamePage.clickGoldButton(100);
    const endTime = Date.now();
    
    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    
    // Verify all clicks registered
    const gold = await gamePage.getGold();
    expect(gold).toBeGreaterThanOrEqual(100);
  });

  test('should load game quickly with large save data', async ({ gamePage, testData }) => {
    // Create a large save state
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Add lots of data
    for (let i = 0; i < 10; i++) {
      await gamePage.buyUpgrade('farm');
    }
    
    await gamePage.saveGame();
    
    // Measure load time
    const startTime = Date.now();
    await gamePage.page.reload();
    await gamePage.page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
  });

  test('should handle multiple simultaneous events efficiently', async ({ adminPage, gamePage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Trigger multiple events quickly
    const eventPromises = [];
    for (let i = 0; i < 5; i++) {
      eventPromises.push(adminPage.triggerEvent('random-event'));
    }
    
    await Promise.all(eventPromises);
    
    // Game should still be responsive
    await gamePage.goto();
    const startTime = Date.now();
    await gamePage.clickGoldButton();
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(100); // Click should register quickly
  });

  test('should maintain stable FPS with many UI elements', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Open multiple panels
    await gamePage.openLeaderboard();
    const achievementsButton = gamePage.page.locator('[data-testid="achievements-button"]');
    await achievementsButton.click();
    
    // Measure interaction responsiveness
    const startTime = Date.now();
    await gamePage.page.locator('[data-testid="close-achievements"]').click();
    await gamePage.closeLeaderboard();
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(500); // UI interactions should be snappy
  });

  test('should handle large numbers without overflow', async ({ adminPage, gamePage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Set very large numbers
    await adminPage.setResources(Number.MAX_SAFE_INTEGER - 1000, 999999, 100);
    
    await gamePage.goto();
    
    // Try to add more gold
    await gamePage.clickGoldButton(10);
    
    // Should handle gracefully (not overflow or crash)
    const gold = await gamePage.getGold();
    expect(gold).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
  });

  test('should efficiently update passive income calculations', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Monitor gold updates
    const goldValues = [];
    for (let i = 0; i < 10; i++) {
      goldValues.push(await gamePage.getGold());
      await gamePage.page.waitForTimeout(1000);
    }
    
    // Verify smooth increments
    for (let i = 1; i < goldValues.length; i++) {
      expect(goldValues[i]).toBeGreaterThan(goldValues[i - 1]);
    }
  });

  test('should handle browser back/forward navigation', async ({ gamePage }) => {
    await gamePage.goto();
    
    // Generate some progress
    await gamePage.clickGoldButton(50);
    const goldBefore = await gamePage.getGold();
    
    // Navigate away and back
    await gamePage.page.goto('about:blank');
    await gamePage.page.goBack();
    
    // State should be preserved
    const goldAfter = await gamePage.getGold();
    expect(goldAfter).toBe(goldBefore);
  });

  test('should compress save data efficiently', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('late');
    await gamePage.goto();
    
    // Get save data size
    await gamePage.saveGame();
    
    // Check localStorage usage
    const localStorageSize = await gamePage.page.evaluate(() => {
      let size = 0;
      for (const key in localStorage) {
        size += localStorage[key].length + key.length;
      }
      return size;
    });
    
    // Should be reasonably sized even with late game data
    expect(localStorageSize).toBeLessThan(100000); // Less than 100KB
  });

  test('should handle network latency gracefully', async ({ gamePage, page }) => {
    // Simulate slow network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await route.continue();
    });
    
    await gamePage.goto();
    
    // Game should still be playable
    await gamePage.clickGoldButton();
    const gold = await gamePage.getGold();
    expect(gold).toBeGreaterThan(0);
  });

  test('should batch UI updates efficiently', async ({ gamePage, testData }) => {
    await testData.seedGameProgress('mid');
    await gamePage.goto();
    
    // Monitor DOM updates during passive income
    const updateCount = await gamePage.page.evaluate(() => {
      let count = 0;
      const observer = new MutationObserver(() => count++);
      observer.observe(document.body, { childList: true, subtree: true });
      
      return new Promise(resolve => {
        setTimeout(() => {
          observer.disconnect();
          resolve(count);
        }, 5000);
      });
    });
    
    // Should batch updates, not update every frame
    expect(updateCount).toBeLessThan(100); // Less than 100 updates in 5 seconds
  });
});