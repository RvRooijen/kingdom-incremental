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
- npm of yarn
- VS Code (aanbevolen)

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/kingdom-incremental.git

# Navigate to project
cd kingdom-incremental

# Install dependencies
npm install

# Run tests
npm test

# Run application in development
npm run dev

# Build for production
npm run build
```

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

## 🎯 Roadmap

- [x] Project setup & architecture
- [ ] Core domain implementation
- [ ] Event system
- [ ] Faction mechanics
- [ ] API endpoints
- [ ] Frontend (React/Vue)
- [ ] Multiplayer features