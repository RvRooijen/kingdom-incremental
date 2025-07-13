import { test as base } from '@playwright/test';
import { GamePage } from '../helpers/GamePage';
import { AdminPage } from '../helpers/AdminPage';
import { TestDataSeeder } from '../helpers/TestDataSeeder';

type TestFixtures = {
  gamePage: GamePage;
  adminPage: AdminPage;
  testData: TestDataSeeder;
};

export const test = base.extend<TestFixtures>({
  gamePage: async ({ page }, use) => {
    const gamePage = new GamePage(page);
    await use(gamePage);
  },
  
  adminPage: async ({ page }, use) => {
    const adminPage = new AdminPage(page);
    await use(adminPage);
  },
  
  testData: async ({ page }, use) => {
    const seeder = new TestDataSeeder(page);
    await use(seeder);
    // Cleanup after test
    await seeder.cleanup();
  },
});

export { expect } from './custom-matchers';