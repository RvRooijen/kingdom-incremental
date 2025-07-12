# Technisch Ontwerp: Kingdom Incremental Game

## 1. Game Overzicht

### Concept
Een incremental game waarbij spelers een koninkrijk besturen via politieke beslissingen en gebeurtenissen. Je begint met een kasteel, koning en koningin, en moet navigeren door complexe politieke situaties, factie-relaties balanceren, en je rijk laten groeien door strategische keuzes.

### Core Game Loop
1. Resources genereren (Gold, Influence, Loyalty)
2. Events verschijnen en keuzes maken
3. Faction relationships managen
4. Advisors unlocken via gebeurtenissen
5. Prestige voor permanente bonuses

## 2. Game Mechanics

### Resources
- **Gold**: Hoofdvaluta voor beslissingen en acties
- **Influence**: Politieke macht voor diplomatie
- **Loyalty**: Stabiliteit van het koninkrijk
- **Population**: Grootte van het rijk
- **Military Power**: Defensieve en offensieve kracht

### Royal Court
Het koninkrijk wordt bestuurd via de Royal Court met verschillende advisors:

1. **King & Queen** (Start characters)
   - Genereren: 1 Gold/sec, 1 Influence/sec
   - Kunnen beslissingen nemen over events

2. **Advisors** (Unlock via events)
   - **Treasurer**: +50% Gold generation
   - **Diplomat**: +2 Influence/sec, unlock diplomacy options
   - **General**: +Military Power, unlock military events
   - **Spymaster**: Reveal hidden event options
   - **Court Wizard**: Unlock mystical events

### Event System
Events zijn de kern van het spel. Ze verschijnen regelmatig en vereisen keuzes:

#### Event Types
1. **Political Events**
   - Nobility disputes
   - Succession crises
   - Alliance proposals
   - Trade agreements

2. **Economic Events**
   - Merchant guilds
   - Tax revolts
   - Trade opportunities
   - Economic crises

3. **Military Events**
   - Border conflicts
   - Invasions
   - Rebellion threats
   - Military campaigns

4. **Social Events**
   - Peasant uprisings
   - Religious movements
   - Cultural festivals
   - Plagues/disasters

#### Event Mechanics
- Events hebben **multiple choice options**
- Elke keuze heeft **immediate effects** en **long-term consequences**
- Sommige keuzes zijn alleen beschikbaar met bepaalde advisors of resources
- Events kunnen **event chains** triggeren

### Political System
1. **Factions**
   - Nobility (Traditional power)
   - Merchants (Economic influence)
   - Military (Armed forces)
   - Clergy (Religious authority)
   - Commoners (Popular support)

2. **Faction Mechanics**
   - Elke factie heeft een **approval rating** (0-100)
   - Lage approval kan leiden tot negative events
   - Hoge approval geeft bonuses en positive events
   - Balanceren van factions is cruciaal

3. **Diplomacy**
   - Vorm alliances met neighboring kingdoms
   - Trade agreements voor resource bonuses
   - Marriage alliances voor stability
   - War declarations met consequences

### Prestige System
- Unlock bij succesvol navigeren van 10 major events
- Reset progress maar behoud:
  - Advisor unlock status
  - Sommige faction relationships
  - Event knowledge (nieuwe dialog opties)
  - Permanente resource multipliers

### Progression Milestones
1. **Early Game**: Learn event system, manage basic resources
2. **Mid Game**: Balance factions, unlock advisors, eerste prestige
3. **Late Game**: Complex event chains, multi-faction politics, war campaigns

## 3. Technische Architectuur

### Technology Stack
- **Backend**: Node.js met TypeScript
- **Framework**: Express.js
- **Database**: SQLite (development), PostgreSQL (production) - *planned*
- **Testing**: Jest (106 tests), Supertest
- **Architecture**: Clean Architecture / Domain-Driven Design
- **Patterns**: CQRS, Repository, Domain Events, Value Objects
- **Key Libraries**: 
  - uuid (ID generation)
  - winston (logging) - *ready to implement*
  - cors & helmet (security)
  - dotenv (configuration)

### Project Structuur
```
kingdom-incremental/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── events/
│   │   └── services/
│   ├── application/
│   │   ├── commands/
│   │   ├── queries/
│   │   ├── dtos/
│   │   └── interfaces/
│   ├── infrastructure/
│   │   ├── persistence/
│   │   ├── repositories/
│   │   └── services/
│   └── api/
│       ├── controllers/
│       ├── middleware/
│       └── server.ts
├── tests/
│   ├── domain/
│   ├── application/
│   ├── infrastructure/
│   └── api/
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Domain Model

```typescript
// Core Entities
export class Kingdom extends AggregateRoot {
  private _name: string;
  private _resources: Resources;
  private _court: RoyalCourt;
  private _factions: Map<FactionType, Faction>;
  private _activeEvents: Event[];
  private _eventHistory: EventHistory[];
  private _prestigeLevel: number;
  private _lastCalculation: Date;

  constructor(name: string) {
    super();
    this._name = name;
    this._resources = new Resources();
    this._court = new RoyalCourt();
    this._factions = this.initializeFactions();
    this._activeEvents = [];
    this._eventHistory = [];
    this._prestigeLevel = 0;
    this._lastCalculation = new Date();
  }

  get name(): string { return this._name; }
  get resources(): Resources { return this._resources; }
  get court(): RoyalCourt { return this._court; }
  get factions(): Map<FactionType, Faction> { return this._factions; }
  get activeEvents(): Event[] { return this._activeEvents; }
  get prestigeLevel(): number { return this._prestigeLevel; }
}

export class Resources {
  constructor(
    private _gold: number = 100,
    private _influence: number = 10,
    private _loyalty: number = 50,
    private _population: number = 1000,
    private _militaryPower: number = 10
  ) {}

  get gold(): number { return this._gold; }
  get influence(): number { return this._influence; }
  get loyalty(): number { return this._loyalty; }
  get population(): number { return this._population; }
  get militaryPower(): number { return this._militaryPower; }
}

export class RoyalCourt {
  private _king: Ruler;
  private _queen: Ruler;
  private _advisors: Map<AdvisorType, Advisor>;

  constructor() {
    this._king = new Ruler('King', 'The King');
    this._queen = new Ruler('Queen', 'The Queen');
    this._advisors = new Map();
  }

  get king(): Ruler { return this._king; }
  get queen(): Ruler { return this._queen; }
  get advisors(): Map<AdvisorType, Advisor> { return this._advisors; }
}

export abstract class Event {
  protected _id: string;
  protected _title: string;
  protected _description: string;
  protected _type: EventType;
  protected _choices: EventChoice[];
  protected _expiresAt: Date;

  constructor(title: string, description: string, type: EventType) {
    this._id = generateId();
    this._title = title;
    this._description = description;
    this._type = type;
    this._choices = [];
    this._expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
}

export class EventChoice {
  constructor(
    public description: string,
    public requirements: ResourceRequirement,
    public immediateEffect: EventConsequence,
    public longTermEffects: EventConsequence[] = [],
    public requiredAdvisor?: AdvisorType
  ) {}
}

export class Faction {
  constructor(
    private _type: FactionType,
    private _name: string,
    private _approvalRating: number = 50,
    private _mood: FactionMood = FactionMood.Neutral
  ) {}

  get type(): FactionType { return this._type; }
  get name(): string { return this._name; }
  get approvalRating(): number { return this._approvalRating; }
  get mood(): FactionMood { return this._mood; }
}

// Enums
export enum EventType {
  Political = 'Political',
  Economic = 'Economic',
  Military = 'Military',
  Social = 'Social',
  Diplomatic = 'Diplomatic'
}

export enum FactionType {
  Nobility = 'Nobility',
  Merchants = 'Merchants',
  Military = 'Military',
  Clergy = 'Clergy',
  Commoners = 'Commoners'
}

export enum AdvisorType {
  Treasurer = 'Treasurer',
  Diplomat = 'Diplomat',
  General = 'General',
  Spymaster = 'Spymaster',
  CourtWizard = 'CourtWizard'
}

export enum FactionMood {
  Hostile = 'Hostile',
  Unhappy = 'Unhappy',
  Neutral = 'Neutral',
  Content = 'Content',
  Loyal = 'Loyal'
}
```

### API Endpoints

```
GET    /api/kingdoms/{id}              - Get kingdom state
POST   /api/kingdoms                   - Create new kingdom
PUT    /api/kingdoms/{id}/calculate    - Calculate offline progress

GET    /api/kingdoms/{id}/events       - Get active events
POST   /api/kingdoms/{id}/events/{eventId}/choose - Make event choice

GET    /api/kingdoms/{id}/factions     - Get faction states
GET    /api/kingdoms/{id}/court        - Get royal court status

POST   /api/kingdoms/{id}/advisors/{type}/recruit - Recruit advisor
POST   /api/kingdoms/{id}/prestige     - Perform prestige reset
```

## 4. Test-Driven Development Status

### Test Coverage (Current: 106 tests, 100% passing)
1. **Domain Tests** (41 tests)
   - Kingdom entity tests (4)
   - Resource generation tests (13)
   - Event system tests (14)
   - Faction mechanics tests (10)

2. **Application Tests** (53 tests)
   - Command handler tests (30)
   - Query handler tests (23)
   - DTO validation
   - Error handling

3. **API Tests** (12 tests)
   - Kingdom endpoints (5)
   - Event endpoints (4)
   - Error handling (3)

### Test Examples Available
- Resource generation with advisor bonuses
- Event choice validation
- Faction approval changes
- Offline progression calculation
- API request/response validation

### TDD Workflow
1. Write failing test voor nieuwe feature
2. Implementeer minimale code om test te laten slagen
3. Refactor voor clean code
4. Repeat

### Example Test Cases
```typescript
describe('Kingdom', () => {
  describe('Resource Generation', () => {
    it('should generate resources per second', () => {
      // Arrange
      const kingdom = new Kingdom('TestKingdom');
      const initialGold = kingdom.resources.gold;
      const initialInfluence = kingdom.resources.influence;
      
      // Act
      kingdom.calculateResourceGeneration(10); // 10 seconds
      
      // Assert
      expect(kingdom.resources.gold).toBe(initialGold + 10); // King+Queen = 1 gold/sec * 10 sec
      expect(kingdom.resources.influence).toBe(initialInfluence + 10); // 1 influence/sec * 10 sec
    });
  });

  describe('Event Choices', () => {
    it('should affect faction approval ratings', () => {
      // Arrange
      const kingdom = new Kingdom('TestKingdom');
      const nobilityFaction = kingdom.factions.get(FactionType.Nobility)!;
      const commonersFaction = kingdom.factions.get(FactionType.Commoners)!;
      const initialNobilityApproval = nobilityFaction.approvalRating;
      const initialCommonersApproval = commonersFaction.approvalRating;
      
      const eventChoice = new EventChoice(
        'Support the nobles',
        new ResourceRequirement(),
        new EventConsequence({
          factionEffects: new Map([
            [FactionType.Nobility, 10],
            [FactionType.Commoners, -5]
          ])
        })
      );
      
      // Act
      kingdom.applyEventChoice(eventChoice);
      
      // Assert
      expect(kingdom.factions.get(FactionType.Nobility)!.approvalRating)
        .toBe(initialNobilityApproval + 10);
      expect(kingdom.factions.get(FactionType.Commoners)!.approvalRating)
        .toBe(initialCommonersApproval - 5);
    });
  });

  describe('Faction Events', () => {
    it('should trigger negative events for low faction approval', () => {
      // Arrange
      const kingdom = new Kingdom('TestKingdom');
      kingdom.setFactionApproval(FactionType.Military, 20); // Very low
      
      // Act
      const triggeredEvents = kingdom.checkFactionEvents();
      
      // Assert
      expect(triggeredEvents.some(e => e.type === EventType.Military)).toBe(true);
      expect(triggeredEvents.some(e => 
        e.title.includes('Rebellion') || e.title.includes('Mutiny')
      )).toBe(true);
    });
  });
});
```

## 5. Data Persistence

### Save Game State
- Auto-save elke 30 seconden
- Save on belangrijke acties (building purchase, prestige)
- Offline progression calculation bij game load

### Database Schema
```sql
-- Kingdoms table
CREATE TABLE Kingdoms (
    Id UUID PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Gold DECIMAL(20,2) NOT NULL,
    Influence DECIMAL(20,2) NOT NULL,
    Loyalty DECIMAL(20,2) NOT NULL,
    Population INT NOT NULL,
    MilitaryPower DECIMAL(20,2) NOT NULL,
    PrestigeLevel INT NOT NULL,
    LastCalculation TIMESTAMP NOT NULL,
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL
);

-- Factions table
CREATE TABLE Factions (
    Id UUID PRIMARY KEY,
    KingdomId UUID NOT NULL,
    Type VARCHAR(50) NOT NULL,
    ApprovalRating INT NOT NULL,
    Mood VARCHAR(20) NOT NULL,
    FOREIGN KEY (KingdomId) REFERENCES Kingdoms(Id)
);

-- Events table
CREATE TABLE Events (
    Id UUID PRIMARY KEY,
    KingdomId UUID NOT NULL,
    Type VARCHAR(50) NOT NULL,
    Title VARCHAR(200) NOT NULL,
    Description TEXT NOT NULL,
    ExpiresAt TIMESTAMP NOT NULL,
    Status VARCHAR(20) NOT NULL,
    FOREIGN KEY (KingdomId) REFERENCES Kingdoms(Id)
);

-- EventHistory table
CREATE TABLE EventHistory (
    Id UUID PRIMARY KEY,
    KingdomId UUID NOT NULL,
    EventId UUID NOT NULL,
    ChoiceDescription TEXT NOT NULL,
    ConsequencesJson TEXT NOT NULL,
    OccurredAt TIMESTAMP NOT NULL,
    FOREIGN KEY (KingdomId) REFERENCES Kingdoms(Id)
);

-- Advisors table
CREATE TABLE Advisors (
    Id UUID PRIMARY KEY,
    KingdomId UUID NOT NULL,
    Type VARCHAR(50) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    RecruitedAt TIMESTAMP NOT NULL,
    FOREIGN KEY (KingdomId) REFERENCES Kingdoms(Id)
);
```

## 6. Performance Considerations

### Offline Calculation
- Maximum 24 uur offline progress
- Batch calculations voor efficiency
- Caching van generation rates

### Real-time Updates
- WebSocket voor live updates (toekomstige feature)
- Client-side interpolation
- Server reconciliation

## 7. Security

### API Security
- JWT authentication (toekomstig)
- Rate limiting
- Input validation
- SQL injection protection via parameterized queries

### Game Balance
- Server-side validation van alle acties
- Anti-cheat: tijd validatie
- Resource caps

## 8. Uitbreidingsmogelijkheden

### Fase 2 Features
- Dynasty system (heirs and succession)
- Diplomatic marriages
- Espionage and intrigue
- Religious events and crusades
- Seasonal events (harvest, winter, etc.)

### Fase 3 Features
- Multiplayer diplomacy
- Trade routes between kingdoms
- War campaigns with tactical choices
- Historical scenarios
- Custom event modding

## 9. Development Roadmap

### ✅ Sprint 1 (Completed)
- [x] Project setup with TypeScript and Jest
- [x] Domain models (Kingdom, Event, Faction, Resources)
- [x] Basic resource generation with offline progression
- [x] Royal Court implementation (King, Queen, Advisors)
- [x] Character and Advisor entities
- [x] ResourceGenerator service

### ✅ Sprint 2 (Completed)
- [x] Event system core with 5 event types
- [x] Event choices and consequences
- [x] Resource requirements for choices
- [x] Faction mechanics with approval ratings
- [x] Faction mood system (Hostile to Loyal)
- [x] FactionService for event generation

### ✅ Sprint 3 (Completed)
- [x] Application layer with CQRS pattern
- [x] Command handlers (Create, Choose, Recruit)
- [x] Query handlers (State, Events, Factions)
- [x] REST API implementation with Express
- [x] Error handling middleware
- [x] 106 unit tests with 100% pass rate

### 🚧 Sprint 4 (Current)
- [ ] Simple HTML/JS frontend for testing
- [ ] Database integration (SQLite/PostgreSQL)
- [ ] Prestige system implementation
- [ ] Save/Load functionality
- [ ] WebSocket for real-time updates

### 📋 Future Sprints
- [ ] Complex event chains and storylines
- [ ] Advisor special abilities
- [ ] Achievement system
- [ ] Game balancing and tuning
- [ ] Production deployment
- [ ] Multiplayer features