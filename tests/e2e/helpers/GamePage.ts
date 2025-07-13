import { Page, Locator } from '@playwright/test';

export class GamePage {
  readonly page: Page;
  readonly goldCounter: Locator;
  readonly populationCounter: Locator;
  readonly loyaltyCounter: Locator;
  readonly clickButton: Locator;
  readonly upgradeButtons: Locator;
  readonly advisorSection: Locator;
  readonly eventModal: Locator;
  readonly eventTitle: Locator;
  readonly eventOptions: Locator;
  readonly leaderboardButton: Locator;
  readonly leaderboardModal: Locator;
  readonly saveButton: Locator;
  readonly loadButton: Locator;
  readonly resetButton: Locator;
  readonly settingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Resource counters
    this.goldCounter = page.locator('[data-testid="gold-counter"]');
    this.populationCounter = page.locator('[data-testid="population-counter"]');
    this.loyaltyCounter = page.locator('[data-testid="loyalty-counter"]');
    
    // Main game controls
    this.clickButton = page.locator('[data-testid="click-button"]');
    this.upgradeButtons = page.locator('[data-testid^="upgrade-"]');
    
    // Advisor section
    this.advisorSection = page.locator('[data-testid="advisor-section"]');
    
    // Event system
    this.eventModal = page.locator('[data-testid="event-modal"]');
    this.eventTitle = page.locator('[data-testid="event-title"]');
    this.eventOptions = page.locator('[data-testid^="event-option-"]');
    
    // Navigation
    this.leaderboardButton = page.locator('[data-testid="leaderboard-button"]');
    this.leaderboardModal = page.locator('[data-testid="leaderboard-modal"]');
    
    // Game management
    this.saveButton = page.locator('[data-testid="save-button"]');
    this.loadButton = page.locator('[data-testid="load-button"]');
    this.resetButton = page.locator('[data-testid="reset-button"]');
    this.settingsButton = page.locator('[data-testid="settings-button"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async clickGoldButton(times: number = 1) {
    for (let i = 0; i < times; i++) {
      await this.clickButton.click();
      await this.page.waitForTimeout(50); // Small delay between clicks
    }
  }

  async getGold(): Promise<number> {
    const text = await this.goldCounter.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
  }

  async getPopulation(): Promise<number> {
    const text = await this.populationCounter.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
  }

  async getLoyalty(): Promise<number> {
    const text = await this.loyaltyCounter.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0');
  }

  async buyUpgrade(upgradeName: string) {
    const upgrade = this.page.locator(`[data-testid="upgrade-${upgradeName}"]`);
    await upgrade.click();
  }

  async isUpgradeAvailable(upgradeName: string): Promise<boolean> {
    const upgrade = this.page.locator(`[data-testid="upgrade-${upgradeName}"]`);
    const isDisabled = await upgrade.getAttribute('disabled');
    return isDisabled === null;
  }

  async getUpgradePrice(upgradeName: string): Promise<number> {
    const upgrade = this.page.locator(`[data-testid="upgrade-${upgradeName}"]`);
    const priceText = await upgrade.locator('[data-testid="upgrade-price"]').textContent();
    return parseInt(priceText?.replace(/[^\d]/g, '') || '0');
  }

  async hireAdvisor(advisorType: string) {
    const advisorButton = this.page.locator(`[data-testid="hire-${advisorType}"]`);
    await advisorButton.click();
  }

  async isEventVisible(): Promise<boolean> {
    return await this.eventModal.isVisible();
  }

  async getEventTitle(): Promise<string> {
    return await this.eventTitle.textContent() || '';
  }

  async selectEventOption(optionIndex: number) {
    await this.eventOptions.nth(optionIndex).click();
  }

  async saveGame() {
    await this.saveButton.click();
    await this.page.waitForTimeout(500); // Wait for save to complete
  }

  async loadGame() {
    await this.loadButton.click();
    await this.page.waitForTimeout(500); // Wait for load to complete
  }

  async resetGame() {
    await this.resetButton.click();
    // Confirm reset in dialog
    await this.page.locator('[data-testid="confirm-reset"]').click();
    await this.page.waitForTimeout(500); // Wait for reset to complete
  }

  async openLeaderboard() {
    await this.leaderboardButton.click();
    await this.leaderboardModal.waitFor({ state: 'visible' });
  }

  async closeLeaderboard() {
    await this.page.locator('[data-testid="close-leaderboard"]').click();
    await this.leaderboardModal.waitFor({ state: 'hidden' });
  }

  async getLeaderboardEntries() {
    const entries = await this.page.locator('[data-testid="leaderboard-entry"]').all();
    const leaderboard = [];
    
    for (const entry of entries) {
      const name = await entry.locator('[data-testid="player-name"]').textContent();
      const score = await entry.locator('[data-testid="player-score"]').textContent();
      leaderboard.push({ name, score: parseInt(score?.replace(/[^\d]/g, '') || '0') });
    }
    
    return leaderboard;
  }

  async waitForAutoSave() {
    // Wait for autosave indicator
    await this.page.locator('[data-testid="autosave-indicator"]').waitFor({ state: 'visible' });
    await this.page.locator('[data-testid="autosave-indicator"]').waitFor({ state: 'hidden' });
  }
}