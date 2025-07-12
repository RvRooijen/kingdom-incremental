# Changelog

All notable changes to Kingdom Incremental will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-01-12

### Added
- Initial TypeScript implementation with Clean Architecture
- Domain layer implementation
  - Kingdom entity with resource management
  - Event system with 5 types (Political, Economic, Military, Social, Diplomatic)
  - Faction mechanics with approval ratings and mood system
  - Resource generation with offline progression support
  - Royal Court system (King, Queen, Advisors)
  - Character and Advisor entities
  - ResourceGenerator service for calculating generation rates
  - FactionService for faction event generation

- Application layer with CQRS pattern
  - CreateKingdomCommand for kingdom creation
  - MakeEventChoiceCommand for event decision handling
  - RecruitAdvisorCommand for advisor recruitment
  - GetKingdomStateQuery for retrieving kingdom data
  - GetActiveEventsQuery for fetching active events
  - GetFactionStatusQuery for faction information
  - Comprehensive DTOs for data transfer
  - Custom error types with proper status codes

- REST API with Express.js
  - Kingdom management endpoints
  - Event system endpoints
  - Faction status endpoints
  - Global error handling middleware
  - Request validation

- Test suite with 106 tests
  - Domain layer: 41 tests
  - Application layer: 53 tests
  - API layer: 12 tests
  - 100% test pass rate

- Project infrastructure
  - TypeScript configuration with strict mode
  - Jest testing framework setup
  - ESLint and Prettier configuration
  - Git repository initialization
  - GitHub repository creation

### Technical Details
- Node.js with TypeScript
- Express.js for REST API
- Jest for testing
- Clean Architecture pattern
- Domain-Driven Design principles
- Test-Driven Development approach

### Game Features Implemented
- Resource system (Gold, Influence, Loyalty, Population, Military Power)
- Basic resource generation (King: 1 gold/sec, Queen: 1 influence/sec)
- Advisor bonuses (Treasurer: +50% gold generation)
- Event system with choices and consequences
- Faction approval ratings affecting kingdom stability
- Faction mood system (Hostile, Unhappy, Neutral, Content, Loyal)
- Event generation based on faction approval
- Resource limits (max 10,000 per resource type)

## [Unreleased]

### Planned
- Simple HTML/JavaScript frontend for testing
- Database integration (SQLite for development, PostgreSQL for production)
- Save/Load functionality
- WebSocket support for real-time updates
- Prestige system implementation
- Complex event chains
- Advisor special abilities
- Achievement system
- Game balance tuning