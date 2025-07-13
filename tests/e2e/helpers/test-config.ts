export const testConfig = {
  // Test environment settings
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  adminPassword: process.env.ADMIN_PASSWORD || 'dev123',
  
  // Timeouts
  defaultTimeout: 30000,
  longTimeout: 60000,
  shortTimeout: 5000,
  
  // Test data paths
  testEventsPath: './tests/e2e/data/test-events.json',
  testUsersPath: './tests/e2e/data/test-users.json',
  
  // Game settings for tests
  gameSpeed: {
    fast: 10,
    normal: 1,
    slow: 0.1
  },
  
  // Selectors that might change
  selectors: {
    // Resources
    goldCounter: '[data-testid="gold-counter"]',
    populationCounter: '[data-testid="population-counter"]',
    loyaltyCounter: '[data-testid="loyalty-counter"]',
    
    // Main controls
    clickButton: '[data-testid="click-button"]',
    
    // Upgrades
    upgradePrefix: '[data-testid="upgrade-',
    upgradeSuffix: '"]',
    
    // Advisors
    advisorPrefix: '[data-testid="hire-',
    advisorSuffix: '"]',
    
    // Events
    eventModal: '[data-testid="event-modal"]',
    eventTitle: '[data-testid="event-title"]',
    eventOption: '[data-testid^="event-option-"]',
    
    // Navigation
    leaderboardButton: '[data-testid="leaderboard-button"]',
    achievementsButton: '[data-testid="achievements-button"]',
    settingsButton: '[data-testid="settings-button"]',
    
    // Admin
    adminLogin: '[data-testid="admin-login-button"]',
    adminPassword: '[data-testid="admin-password-input"]'
  },
  
  // Expected game values
  initialState: {
    gold: 0,
    population: 10,
    loyalty: 50
  },
  
  // Upgrade costs (for validation)
  upgradeCosts: {
    farm: 10,
    market: 50,
    blacksmith: 200,
    barracks: 500,
    temple: 1000,
    university: 5000,
    castle: 10000,
    cathedral: 50000
  },
  
  // Achievement thresholds
  achievements: {
    firstGold: 1,
    firstUpgrade: 1,
    population100: 100,
    population1000: 1000,
    gold10k: 10000,
    gold1m: 1000000,
    allAdvisors: 5,
    prestige1: 1
  }
};

// Helper to build selectors
export function getUpgradeSelector(upgradeName: string): string {
  return `${testConfig.selectors.upgradePrefix}${upgradeName}${testConfig.selectors.upgradeSuffix}`;
}

export function getAdvisorSelector(advisorName: string): string {
  return `${testConfig.selectors.advisorPrefix}${advisorName}${testConfig.selectors.advisorSuffix}`;
}