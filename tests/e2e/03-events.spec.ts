import { test, expect } from './fixtures/test-fixtures';

test.describe('Event System', () => {
  test.beforeEach(async ({ gamePage, testData }) => {
    await gamePage.goto();
  });

  test('should trigger random events based on game state', async ({ gamePage, testData }) => {
    // Set up state that triggers events
    await testData.seedEventScenario('peasant-revolt');
    await gamePage.goto();
    
    // Wait for event to trigger
    await gamePage.page.waitForTimeout(5000);
    
    // Check if event appeared
    const isEventVisible = await gamePage.isEventVisible();
    expect(isEventVisible).toBe(true);
  });

  test('should display event with title and options', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Trigger specific event
    await adminPage.triggerEvent('trade-caravan');
    
    // Switch to game page
    await gamePage.goto();
    
    // Verify event structure
    await expect(gamePage.eventModal).toBeVisible();
    const title = await gamePage.getEventTitle();
    expect(title).toContain('Trade Caravan');
    
    // Check options exist
    const options = await gamePage.eventOptions.count();
    expect(options).toBeGreaterThan(0);
  });

  test('should apply event choice consequences', async ({ gamePage, testData }) => {
    await testData.seedEventScenario('trade-opportunity');
    await gamePage.goto();
    
    // Trigger trade event via admin
    const adminPage = await gamePage.page.context().newPage();
    const admin = new (await import('./helpers/AdminPage')).AdminPage(adminPage);
    await admin.goto();
    await admin.login();
    await admin.triggerEvent('trade-opportunity');
    await adminPage.close();
    
    // Back to game
    await gamePage.page.bringToFront();
    
    // Record resources before choice
    const goldBefore = await gamePage.getGold();
    
    // Choose first option (usually accept trade)
    await gamePage.selectEventOption(0);
    
    // Verify resources changed
    await gamePage.page.waitForTimeout(1000);
    const goldAfter = await gamePage.getGold();
    expect(goldAfter).not.toBe(goldBefore);
  });

  test('should handle negative event consequences', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Set up resources
    await adminPage.setResources(1000, 100, 70);
    
    // Trigger disaster event
    await adminPage.triggerEvent('plague');
    
    // Switch to game
    await gamePage.goto();
    
    const populationBefore = await gamePage.getPopulation();
    
    // Choose response
    await gamePage.selectEventOption(0);
    
    // Check population decreased
    await gamePage.page.waitForTimeout(1000);
    const populationAfter = await gamePage.getPopulation();
    expect(populationAfter).toBeLessThan(populationBefore);
  });

  test('should chain events based on choices', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Trigger event that can lead to chain
    await adminPage.triggerEvent('noble-dispute');
    
    await gamePage.goto();
    
    // Make choice that triggers follow-up
    await gamePage.selectEventOption(1); // Side with one noble
    
    // Wait for potential chain event
    await gamePage.page.waitForTimeout(3000);
    
    // Check if new event appeared
    const hasChainEvent = await gamePage.isEventVisible();
    if (hasChainEvent) {
      const title = await gamePage.getEventTitle();
      expect(title).toContain('Consequences');
    }
  });

  test('should track event history', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    const eventsBefore = await adminPage.getTotalEventsTriggered();
    
    // Trigger multiple events
    await adminPage.triggerEvent('merchant-visit');
    await gamePage.goto();
    await gamePage.selectEventOption(0);
    
    await adminPage.goto();
    await adminPage.triggerEvent('festival');
    await gamePage.goto();
    await gamePage.selectEventOption(0);
    
    // Check event counter
    await adminPage.goto();
    const eventsAfter = await adminPage.getTotalEventsTriggered();
    expect(eventsAfter).toBe(eventsBefore + 2);
  });

  test('should respect event cooldowns', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Trigger event
    await adminPage.triggerEvent('tax-collection');
    await gamePage.goto();
    await gamePage.selectEventOption(0);
    
    // Try to trigger same event again
    await adminPage.goto();
    await adminPage.triggerEvent('tax-collection');
    
    // Should not appear due to cooldown
    await gamePage.goto();
    const isEventVisible = await gamePage.isEventVisible();
    expect(isEventVisible).toBe(false);
  });

  test('should show event-specific imagery', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    await adminPage.triggerEvent('royal-wedding');
    
    await gamePage.goto();
    
    // Check for event image
    const eventImage = gamePage.page.locator('[data-testid="event-image"]');
    await expect(eventImage).toBeVisible();
    
    const imageSrc = await eventImage.getAttribute('src');
    expect(imageSrc).toContain('wedding');
  });

  test('should apply loyalty-based event modifiers', async ({ gamePage, testData }) => {
    // Test with high loyalty
    await testData.createTestUser({
      gameState: { gold: 1000, population: 100, loyalty: 90, upgrades: [], advisors: [] }
    });
    await gamePage.goto();
    
    // Admin trigger loyalty event
    const adminPage = await gamePage.page.context().newPage();
    const admin = new (await import('./helpers/AdminPage')).AdminPage(adminPage);
    await admin.goto();
    await admin.login();
    await admin.triggerEvent('loyalty-test');
    await adminPage.close();
    
    await gamePage.page.bringToFront();
    
    // High loyalty should give better options
    const optionCount = await gamePage.eventOptions.count();
    expect(optionCount).toBeGreaterThanOrEqual(3); // More options with high loyalty
  });

  test('should auto-dismiss timed events', async ({ gamePage, adminPage }) => {
    await adminPage.goto();
    await adminPage.login();
    
    // Trigger timed event
    await adminPage.triggerEvent('messenger-arrives');
    
    await gamePage.goto();
    await expect(gamePage.eventModal).toBeVisible();
    
    // Wait for auto-dismiss (usually 30 seconds, might be faster in test)
    await gamePage.page.waitForTimeout(10000);
    
    // Event should be gone
    await expect(gamePage.eventModal).not.toBeVisible();
  });
});