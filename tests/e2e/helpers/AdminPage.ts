import { Page, Locator } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly adminLoginButton: Locator;
  readonly adminPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly goldInput: Locator;
  readonly populationInput: Locator;
  readonly loyaltyInput: Locator;
  readonly applyResourcesButton: Locator;
  readonly triggerEventButton: Locator;
  readonly eventSelect: Locator;
  readonly resetAllDataButton: Locator;
  readonly exportDataButton: Locator;
  readonly importDataButton: Locator;
  readonly configSection: Locator;
  readonly playerStatsSection: Locator;
  readonly activePlayersCount: Locator;
  readonly totalEventsTriggered: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Login elements
    this.adminLoginButton = page.locator('[data-testid="admin-login-button"]');
    this.adminPasswordInput = page.locator('[data-testid="admin-password-input"]');
    this.submitButton = page.locator('[data-testid="admin-submit-button"]');
    
    // Resource management
    this.goldInput = page.locator('[data-testid="admin-gold-input"]');
    this.populationInput = page.locator('[data-testid="admin-population-input"]');
    this.loyaltyInput = page.locator('[data-testid="admin-loyalty-input"]');
    this.applyResourcesButton = page.locator('[data-testid="apply-resources-button"]');
    
    // Event management
    this.triggerEventButton = page.locator('[data-testid="trigger-event-button"]');
    this.eventSelect = page.locator('[data-testid="event-select"]');
    
    // Data management
    this.resetAllDataButton = page.locator('[data-testid="reset-all-data-button"]');
    this.exportDataButton = page.locator('[data-testid="export-data-button"]');
    this.importDataButton = page.locator('[data-testid="import-data-button"]');
    
    // Configuration
    this.configSection = page.locator('[data-testid="config-section"]');
    
    // Analytics
    this.playerStatsSection = page.locator('[data-testid="player-stats-section"]');
    this.activePlayersCount = page.locator('[data-testid="active-players-count"]');
    this.totalEventsTriggered = page.locator('[data-testid="total-events-triggered"]');
  }

  async goto() {
    await this.page.goto('/dev.html');
    await this.page.waitForLoadState('networkidle');
  }

  async login(password: string = 'dev123') {
    await this.adminPasswordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForTimeout(500);
  }

  async setResources(gold: number, population: number, loyalty: number) {
    await this.goldInput.fill(gold.toString());
    await this.populationInput.fill(population.toString());
    await this.loyaltyInput.fill(loyalty.toString());
    await this.applyResourcesButton.click();
    await this.page.waitForTimeout(500);
  }

  async triggerEvent(eventId: string) {
    await this.eventSelect.selectOption(eventId);
    await this.triggerEventButton.click();
    await this.page.waitForTimeout(500);
  }

  async resetAllData() {
    await this.resetAllDataButton.click();
    // Confirm in dialog
    await this.page.locator('[data-testid="confirm-reset-all"]').click();
    await this.page.waitForTimeout(1000);
  }

  async exportGameData(): Promise<string> {
    // Click export and wait for download
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.exportDataButton.click()
    ]);
    
    // Read the downloaded file
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString()));
      stream.on('error', reject);
    });
  }

  async importGameData(jsonData: string) {
    // Create a file input and upload the data
    await this.page.setInputFiles('[data-testid="import-file-input"]', {
      name: 'gamedata.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonData)
    });
    await this.importDataButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getActivePlayersCount(): Promise<number> {
    const text = await this.activePlayersCount.textContent();
    return parseInt(text || '0');
  }

  async getTotalEventsTriggered(): Promise<number> {
    const text = await this.totalEventsTriggered.textContent();
    return parseInt(text || '0');
  }

  async updateConfig(configKey: string, value: string) {
    const configInput = this.page.locator(`[data-testid="config-${configKey}"]`);
    await configInput.fill(value);
    await this.page.locator(`[data-testid="save-config-${configKey}"]`).click();
    await this.page.waitForTimeout(500);
  }

  async getConfigValue(configKey: string): Promise<string> {
    const configInput = this.page.locator(`[data-testid="config-${configKey}"]`);
    return await configInput.inputValue();
  }

  async isLoggedIn(): Promise<boolean> {
    // Check if admin controls are visible
    return await this.configSection.isVisible();
  }
}