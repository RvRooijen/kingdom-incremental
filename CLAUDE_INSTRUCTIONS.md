# Kingdom Incremental Game - Claude Instructions

## 🎮 Project Overview

Dit is een **incremental kingdom management game** gebouwd met **Node.js, TypeScript** en **Clean Architecture**. Het spel focust op **politieke beslissingen**, **gebeurtenissen**, en **factie management** in plaats van traditionele gebouw-mechanics.

**Belangrijke info:**
- Eigenaar: Rick
- Taal: Nederlands (behalve technische termen)
- Development platform: Termux op Android
- Methodologie: Test-Driven Development (TDD)
- Architecture: Domain-Driven Design (DDD) met Clean Architecture
- Runtime: Node.js met TypeScript voor type safety

## 📁 Project Structuur

```
kingdom-incremental/
├── src/
│   ├── domain/           # Core business logic, entities, value objects
│   ├── application/      # Use cases, commands, queries, DTOs
│   ├── infrastructure/   # Data access, external services
│   └── api/              # REST API endpoints
├── tests/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── api/
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Test configuration
└── .eslintrc.js          # Code style rules
```

## 🎯 Core Game Mechanics

### Resources
- **Gold**: Hoofdvaluta voor beslissingen
- **Influence**: Politieke macht
- **Loyalty**: Stabiliteit van het rijk
- **Population**: Grootte van het rijk
- **Military Power**: Defensieve kracht

### Systems
1. **Event System**: Random en faction-triggered events met keuzes
2. **Faction System**: 5 facties (Nobility, Merchants, Military, Clergy, Commoners)
3. **Royal Court**: King, Queen, en 5 soorten advisors
4. **Prestige System**: Reset met permanente bonuses

## 🛠️ Technical Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: SQLite (dev), PostgreSQL (prod)
- **ORM**: TypeORM of Prisma
- **Testing**: Jest, Supertest
- **Patterns**: CQRS, Repository, Unit of Work, Strategy, Observer
- **Libraries**: Express, TypeDI (dependency injection), Winston (logging)

## 📝 Development Guidelines

### TDD Workflow
1. **RED**: Schrijf eerst een failing test
2. **GREEN**: Minimale code om test te laten slagen
3. **REFACTOR**: Verbeter code kwaliteit

### Test Coverage Targets
- Unit Tests: 75%
- Integration Tests: 20%
- E2E Tests: 5%

### Coding Standards
- TypeScript strict mode enabled
- ESLint + Prettier voor code formatting
- No any types allowed
- 100% type coverage

## 🚀 Getting Started

### Prerequisites
```bash
# Install Node.js in Termux
pkg install nodejs

# Check versions
node --version   # Should be 18.x or higher
npm --version    # Should be 8.x or higher
```

### Build & Run
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run in development (with hot reload)
npm run dev

# Run in production
npm start
```

### Database Setup
```bash
# Run migrations
npm run migration:run

# Create new migration
npm run migration:create --name=InitialCreate

# Revert migration
npm run migration:revert
```

## 🎮 Current Implementation Status

### ✅ Completed
- Project structure setup
- Solution and project files
- Basic folder structure
- Development configuration files
- Core enums (EventType, FactionType, etc.)
- Aggregate root base class

### 🚧 Next Steps (Sprint 1)
1. [ ] Implement Kingdom aggregate root
2. [ ] Create Resources value object
3. [ ] Implement basic Event entities
4. [ ] Setup Royal Court with King/Queen
5. [ ] Create first unit tests
6. [ ] Implement resource generation logic

### 📋 Backlog
- Event system implementation
- Faction mechanics
- Advisor system
- API endpoints
- Frontend (later phase)

## 🧪 Test Examples

### Domain Test
```typescript
describe('Kingdom', () => {
  it('should start with default resources', () => {
    // Arrange & Act
    const kingdom = new Kingdom('Test Kingdom');
    
    // Assert
    expect(kingdom.resources.gold).toBe(100);
    expect(kingdom.resources.influence).toBe(10);
  });
});
```

### Integration Test
```typescript
describe('KingdomRepository', () => {
  it('should save and retrieve kingdom', async () => {
    // Arrange
    const kingdom = new Kingdom('Test Kingdom');
    
    // Act
    await repository.save(kingdom);
    const retrieved = await repository.findById(kingdom.id);
    
    // Assert
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Kingdom');
  });
});
```

## 🏗️ Architecture Decisions

### Domain Layer
- Pure C# classes, no dependencies
- Rich domain model with business logic
- Value objects for immutability
- Domain events for side effects

### Application Layer
- CQRS with MediatR
- DTOs for data transfer
- Use cases as command/query handlers
- FluentValidation for input validation

### Infrastructure Layer
- Entity Framework Core for persistence
- Repository pattern implementation
- External service integrations

### API Layer
- RESTful endpoints
- OpenAPI/Swagger documentation
- Global exception handling
- Serilog for structured logging

## 🔧 Common Commands

```bash
# Install new package
npm install express @types/express

# Run specific test
npm test -- Kingdom.test.ts

# Watch mode for tests
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Important Files to Review

1. **TECHNICAL_DESIGN.md** - Complete game mechanics and systems
2. **UML_DESIGN.puml** - Visual system design (class diagrams, sequences, etc.)
3. **DESIGN_PATTERNS.md** - Detailed pattern implementations
4. **TEST_STRATEGY.md** - Testing approach and examples

## ⚠️ Important Notes

- **ALWAYS** write tests first (TDD)
- **NEVER** commit without running tests
- **USE** domain events for side effects
- **AVOID** anemic domain models
- **PREFER** immutability where possible
- **FOLLOW** the established patterns

## 🎯 Current Focus

We zijn nu in **Sprint 1** met focus op:
1. Domain model implementation
2. Basic resource generation
3. Royal Court setup
4. Initial test coverage

De volgende stap is het implementeren van de **Kingdom** aggregate root met bijbehorende tests.