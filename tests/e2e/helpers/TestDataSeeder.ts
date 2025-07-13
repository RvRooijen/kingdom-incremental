import { Page } from '@playwright/test';

interface GameState {
  gold: number;
  population: number;
  loyalty: number;
  upgrades: string[];
  advisors: string[];
}

interface TestUser {
  id: string;
  name: string;
  gameState: GameState;
}

export class TestDataSeeder {
  private page: Page;
  private baseUrl: string;
  private createdUsers: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  async createTestUser(userData: Partial<TestUser>): Promise<TestUser> {
    const defaultUser: TestUser = {
      id: `test-user-${Date.now()}`,
      name: `TestUser${Math.floor(Math.random() * 10000)}`,
      gameState: {
        gold: 0,
        population: 10,
        loyalty: 50,
        upgrades: [],
        advisors: []
      }
    };

    const user = { ...defaultUser, ...userData };
    
    // Create user via API
    const response = await this.page.request.post(`${this.baseUrl}/api/test/users`, {
      data: user
    });

    if (response.ok()) {
      this.createdUsers.push(user.id);
      return user;
    }

    throw new Error(`Failed to create test user: ${response.status()}`);
  }

  async createMultipleUsers(count: number, baseData?: Partial<TestUser>): Promise<TestUser[]> {
    const users: TestUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        ...baseData,
        name: `TestUser${i + 1}`
      });
      users.push(user);
    }
    
    return users;
  }

  async seedLeaderboard(entries: Array<{ name: string; score: number }>) {
    for (const entry of entries) {
      await this.createTestUser({
        name: entry.name,
        gameState: {
          gold: entry.score,
          population: Math.floor(entry.score / 100),
          loyalty: 50 + Math.floor(Math.random() * 50),
          upgrades: this.generateRandomUpgrades(entry.score),
          advisors: this.generateRandomAdvisors(entry.score)
        }
      });
    }
  }

  async seedGameProgress(progressLevel: 'early' | 'mid' | 'late'): Promise<TestUser> {
    const progressData = {
      early: {
        gold: 100,
        population: 15,
        loyalty: 60,
        upgrades: ['farm', 'market'],
        advisors: []
      },
      mid: {
        gold: 10000,
        population: 100,
        loyalty: 75,
        upgrades: ['farm', 'market', 'blacksmith', 'barracks', 'temple'],
        advisors: ['treasurer', 'general']
      },
      late: {
        gold: 1000000,
        population: 1000,
        loyalty: 90,
        upgrades: ['farm', 'market', 'blacksmith', 'barracks', 'temple', 'university', 'castle', 'cathedral'],
        advisors: ['treasurer', 'general', 'spymaster', 'diplomat', 'architect']
      }
    };

    return await this.createTestUser({
      name: `${progressLevel}GamePlayer`,
      gameState: progressData[progressLevel]
    });
  }

  async seedEventScenario(eventType: string): Promise<void> {
    // Set up specific game state for testing events
    const eventScenarios: Record<string, GameState> = {
      'peasant-revolt': {
        gold: 5000,
        population: 200,
        loyalty: 20, // Low loyalty triggers revolt
        upgrades: ['farm', 'market', 'barracks'],
        advisors: ['general']
      },
      'trade-opportunity': {
        gold: 1000,
        population: 50,
        loyalty: 70,
        upgrades: ['market', 'blacksmith'],
        advisors: ['treasurer']
      },
      'diplomatic-crisis': {
        gold: 20000,
        population: 300,
        loyalty: 60,
        upgrades: ['barracks', 'temple', 'castle'],
        advisors: ['diplomat', 'general']
      }
    };

    const scenario = eventScenarios[eventType];
    if (scenario) {
      await this.createTestUser({
        name: `EventTest_${eventType}`,
        gameState: scenario
      });
    }
  }

  async cleanup() {
    // Clean up all created test users
    for (const userId of this.createdUsers) {
      try {
        await this.page.request.delete(`${this.baseUrl}/api/test/users/${userId}`);
      } catch (error) {
        console.error(`Failed to cleanup user ${userId}:`, error);
      }
    }
    this.createdUsers = [];
  }

  async resetDatabase() {
    // Reset entire test database
    await this.page.request.post(`${this.baseUrl}/api/test/reset`);
  }

  private generateRandomUpgrades(score: number): string[] {
    const allUpgrades = ['farm', 'market', 'blacksmith', 'barracks', 'temple', 'university', 'castle', 'cathedral'];
    const upgradeCount = Math.min(Math.floor(score / 5000), allUpgrades.length);
    return allUpgrades.slice(0, upgradeCount);
  }

  private generateRandomAdvisors(score: number): string[] {
    const allAdvisors = ['treasurer', 'general', 'spymaster', 'diplomat', 'architect'];
    const advisorCount = Math.min(Math.floor(score / 10000), allAdvisors.length);
    return allAdvisors.slice(0, advisorCount);
  }

  async setGameSpeed(multiplier: number) {
    // Set game speed for testing
    await this.page.request.post(`${this.baseUrl}/api/test/game-speed`, {
      data: { multiplier }
    });
  }

  async simulateTimePassing(minutes: number) {
    // Simulate time passing for testing passive income
    await this.page.request.post(`${this.baseUrl}/api/test/simulate-time`, {
      data: { minutes }
    });
  }
}