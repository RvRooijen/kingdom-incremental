# E2E Tests for Kingdom Incremental Game

This directory contains end-to-end tests for the Kingdom Incremental game using Playwright.

## Structure

```
tests/e2e/
├── fixtures/          # Test fixtures and setup
├── helpers/          # Page objects and utilities
├── data/             # Test data and seeds
├── *.spec.ts         # Test specifications
└── README.md         # This file
```

## Test Categories

1. **01-basic-gameplay.spec.ts** - Core game mechanics (clicking, resources, upgrades)
2. **02-advisors.spec.ts** - Advisor system and effects
3. **03-events.spec.ts** - Random event system
4. **04-leaderboard.spec.ts** - Leaderboard functionality
5. **05-admin-panel.spec.ts** - Developer admin panel
6. **06-progression.spec.ts** - Game progression and milestones
7. **07-performance.spec.ts** - Performance and optimization tests
8. **08-integration.spec.ts** - Full integration scenarios

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run specific test file
npm run test:e2e tests/e2e/01-basic-gameplay.spec.ts

# Debug tests
npm run test:e2e:debug

# Run headed (see browser)
npm run test:e2e:headed
```

## Page Objects

- **GamePage** - Main game interface interactions
- **AdminPage** - Admin panel operations
- **TestDataSeeder** - Test data creation and cleanup

## Test Data

- `test-events.json` - Predefined game events for testing
- `test-users.json` - User profiles for different game stages

## Configuration

Tests use the configuration in `playwright.config.ts` at the project root.

## Writing New Tests

1. Use the test fixtures from `fixtures/test-fixtures.ts`
2. Follow the existing pattern for test organization
3. Use page objects for UI interactions
4. Clean up test data using the seeder's cleanup method

## Best Practices

1. Each test should be independent
2. Use meaningful test descriptions
3. Clean up created data after tests
4. Use data-testid attributes for reliable selectors
5. Test both happy paths and edge cases