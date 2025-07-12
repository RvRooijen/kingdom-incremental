# Kingdom Incremental Game

Een politiek-gedreven incremental game waar je een koninkrijk bestuurt door strategische beslissingen te maken tijdens gebeurtenissen.

## 🎮 Game Features

- **Event-Driven Gameplay**: Navigeer door politieke, economische, militaire en sociale gebeurtenissen
- **Faction Management**: Balanceer de belangen van 5 verschillende facties
- **Royal Court**: Beheer je koninkrijk met koning, koningin en gespecialiseerde adviseurs
- **Prestige System**: Reset je voortgang voor permanente bonuses
- **Resource Management**: Beheer Gold, Influence, Loyalty, Population en Military Power

## 🛠️ Technical Stack

- **Node.js & TypeScript** - Backend runtime met type safety
- **Express.js** - Web framework
- **Clean Architecture** - Separation of concerns
- **Domain-Driven Design** - Rich domain model
- **Test-Driven Development** - Quality first approach
- **SQLite/PostgreSQL** - Data persistence
- **Jest** - Testing framework

## 📁 Project Structure

```
src/
├── domain/           # Business logic & entities
├── application/      # Use cases & orchestration
├── infrastructure/   # External concerns
└── api/              # HTTP endpoints

tests/
├── domain/
├── application/
├── infrastructure/
└── api/
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm (of yarn)
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/RvRooijen/kingdom-incremental.git

# Navigate to project
cd kingdom-incremental

# Install dependencies
npm install

# Run tests (106 tests should pass)
npm test

# Run application in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### API Endpoints
Once the server is running (default port 3000):

- `POST /api/kingdoms` - Create a new kingdom
- `GET /api/kingdoms/:id` - Get kingdom state
- `PUT /api/kingdoms/:id/calculate` - Calculate resource tick
- `GET /api/kingdoms/:id/events` - Get active events
- `POST /api/kingdoms/:id/events/:eventId/choose` - Make event choice

See [API Documentation](docs/API.md) for full details.

## 📚 Documentation

- [Technical Design](TECHNICAL_DESIGN.md) - Complete game design document
- [UML Diagrams](UML_DESIGN.puml) - System architecture visualized
- [Design Patterns](DESIGN_PATTERNS.md) - Patterns and implementations
- [Test Strategy](TEST_STRATEGY.md) - TDD approach and examples
- [Development Guide](CLAUDE_INSTRUCTIONS.md) - Detailed development instructions

## 🧪 Testing

We follow Test-Driven Development with:
- Unit Tests: 75% coverage target
- Integration Tests: 20% coverage target
- E2E Tests: 5% coverage target

Run tests:
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Write tests first (TDD)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

Rick - Initial work

## 🎯 Current Status

### ✅ Completed (v0.1.0)
- [x] Project setup & architecture
- [x] Complete domain layer implementation
  - [x] Kingdom entity with resource management
  - [x] Event system (5 event types: Political, Economic, Military, Social, Diplomatic)
  - [x] Faction mechanics with approval ratings and mood system
  - [x] Resource generation with offline progression
  - [x] Royal Court with King, Queen, and Advisor system
- [x] Application layer with CQRS pattern
  - [x] Commands: CreateKingdom, MakeEventChoice, RecruitAdvisor
  - [x] Queries: GetKingdomState, GetActiveEvents, GetFactionStatus
  - [x] DTOs and error handling
- [x] REST API endpoints
  - [x] Kingdom management endpoints
  - [x] Event system endpoints
  - [x] Faction status endpoints
- [x] Comprehensive test suite (106 tests, 100% passing)
- [x] GitHub repository setup

### 🚧 In Progress
- [ ] Simple frontend for testing
- [ ] Database integration (SQLite/PostgreSQL)
- [ ] WebSocket support for real-time updates

### 📋 Planned Features
- [ ] Advanced event chains
- [ ] Advisor special abilities
- [ ] Prestige system
- [ ] Achievement system
- [ ] Save/Load functionality
- [ ] Multiplayer features