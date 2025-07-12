# Test-Driven Development Strategy

## Testing Philosophy

### Red-Green-Refactor Cycle
1. **Red**: Write a failing test that defines desired functionality
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code quality while keeping tests green

### Test Pyramid
```
         /\
        /E2E\       (5%)  - Critical user journeys
       /------\
      /Integration\ (20%) - API, Database, External services  
     /------------\
    /   Unit Tests \ (75%) - Domain logic, Business rules
   /________________\
```

## 1. Unit Tests

### Domain Entity Tests

```csharp
public class KingdomTests
{
    [Fact]
    public void Kingdom_Should_Start_With_Default_Resources()
    {
        // Arrange & Act
        var kingdom = new Kingdom("Test Kingdom");
        
        // Assert
        kingdom.Resources.Gold.Should().Be(100);
        kingdom.Resources.Influence.Should().Be(10);
        kingdom.Resources.Loyalty.Should().Be(50);
        kingdom.Resources.Population.Should().Be(100);
        kingdom.Resources.MilitaryPower.Should().Be(10);
    }
    
    [Fact]
    public void MakeEventChoice_Should_Deduct_Resources()
    {
        // Arrange
        var kingdom = new Kingdom("Test Kingdom");
        var choice = new EventChoiceBuilder()
            .WithResourceRequirement(gold: 50)
            .Build();
        var @event = new EventBuilder()
            .WithChoice(choice)
            .Build();
        kingdom.TriggerEvent(@event);
        
        // Act
        var result = kingdom.MakeEventChoice(@event.Id, choice.Id);
        
        // Assert
        kingdom.Resources.Gold.Should().Be(50); // 100 - 50
        result.IsSuccess.Should().BeTrue();
    }
    
    [Theory]
    [InlineData(100, 200, false)] // Not enough gold
    [InlineData(200, 100, true)]  // Enough gold
    public void CanAfford_Should_Check_Resource_Requirements(
        decimal availableGold, decimal requiredGold, bool expectedResult)
    {
        // Arrange
        var kingdom = new Kingdom("Test Kingdom");
        kingdom.AddResources(new Resources(Gold: availableGold - 100)); // Adjust for starting gold
        var requirement = new ResourceRequirement { Gold = requiredGold };
        
        // Act
        var canAfford = kingdom.CanAfford(requirement);
        
        // Assert
        canAfford.Should().Be(expectedResult);
    }
}
```

### Event System Tests

```csharp
public class EventTests
{
    [Fact]
    public void Event_Should_Expire_After_Timeout()
    {
        // Arrange
        var @event = new PoliticalEvent(
            "Test Event", 
            "Description",
            expiresIn: TimeSpan.FromMinutes(5));
            
        // Act
        var isExpiredNow = @event.IsExpired();
        var willExpire = @event.WillExpireAt(DateTime.UtcNow.AddMinutes(6));
        
        // Assert
        isExpiredNow.Should().BeFalse();
        willExpire.Should().BeTrue();
    }
    
    [Fact]
    public void EventChoice_With_Advisor_Requirement_Should_Be_Unavailable()
    {
        // Arrange
        var kingdom = new Kingdom("Test Kingdom");
        var choice = new EventChoiceBuilder()
            .RequiringAdvisor(AdvisorType.Spymaster)
            .Build();
            
        // Act
        var isAvailable = choice.IsAvailable(kingdom);
        
        // Assert
        isAvailable.Should().BeFalse();
    }
    
    [Fact]
    public void EventChoice_Should_Apply_Faction_Effects()
    {
        // Arrange
        var kingdom = new Kingdom("Test Kingdom");
        var initialApproval = kingdom.Factions[FactionType.Nobility].ApprovalRating;
        
        var choice = new EventChoiceBuilder()
            .WithFactionEffect(FactionType.Nobility, +10)
            .WithFactionEffect(FactionType.Commoners, -5)
            .Build();
            
        // Act
        choice.Execute(kingdom);
        
        // Assert
        kingdom.Factions[FactionType.Nobility].ApprovalRating
            .Should().Be(initialApproval + 10);
        kingdom.Factions[FactionType.Commoners].ApprovalRating
            .Should().Be(initialApproval - 5);
    }
}
```

### Resource Calculation Tests

```csharp
public class ResourceCalculatorTests
{
    private readonly ResourceCalculatorService _calculator;
    
    public ResourceCalculatorTests()
    {
        _calculator = new ResourceCalculatorService();
    }
    
    [Fact]
    public void Should_Calculate_Base_Generation_From_Rulers()
    {
        // Arrange
        var kingdom = new KingdomBuilder()
            .WithKing("King Test")
            .WithQueen("Queen Test")
            .Build();
            
        // Act
        var generation = _calculator.CalculateGeneration(kingdom, seconds: 10);
        
        // Assert
        generation.Gold.Should().Be(10); // (King: 0.5 + Queen: 0.5) * 10 seconds
        generation.Influence.Should().Be(10);
    }
    
    [Fact]
    public void Should_Apply_Prestige_Multiplier()
    {
        // Arrange
        var kingdom = new KingdomBuilder()
            .WithPrestigeLevel(3)
            .Build();
            
        // Act
        var generation = _calculator.CalculateGeneration(kingdom, seconds: 10);
        
        // Assert
        generation.Gold.Should().Be(13); // Base 10 * 1.3 (prestige multiplier)
    }
    
    [Theory]
    [InlineData(1, 24, 86400)]   // 1 day max offline
    [InlineData(2, 24, 172800)]  // 2 days capped at 1 day
    public void Should_Cap_Offline_Progress(
        int daysOffline, int expectedHours, int expectedSeconds)
    {
        // Arrange
        var kingdom = new Kingdom("Test");
        var offlineTime = TimeSpan.FromDays(daysOffline);
        
        // Act
        var progress = _calculator.CalculateOfflineProgress(kingdom, offlineTime);
        
        // Assert
        progress.TimeCalculated.Should().Be(TimeSpan.FromHours(expectedHours));
        progress.ResourcesGained.Gold.Should().Be(expectedSeconds * 0.5m);
    }
}
```

### Faction Tests

```csharp
public class FactionTests
{
    [Theory]
    [InlineData(90, FactionMood.Loyal)]
    [InlineData(70, FactionMood.Happy)]
    [InlineData(50, FactionMood.Neutral)]
    [InlineData(30, FactionMood.Unhappy)]
    [InlineData(10, FactionMood.Hostile)]
    [InlineData(5, FactionMood.Rebellious)]
    public void Faction_Mood_Should_Match_Approval(int approval, FactionMood expectedMood)
    {
        // Arrange
        var faction = new Faction(FactionType.Nobility, "Nobles");
        
        // Act
        faction.SetApproval(approval);
        
        // Assert
        faction.Mood.Should().Be(expectedMood);
    }
    
    [Fact]
    public void Low_Faction_Approval_Should_Generate_Negative_Events()
    {
        // Arrange
        var faction = new Faction(FactionType.Military, "Army");
        faction.SetApproval(15); // Very low
        
        // Act
        var events = faction.CheckForEvents();
        
        // Assert
        events.Should().NotBeEmpty();
        events.Should().Contain(e => 
            e.Type == EventType.Military && 
            e.Title.Contains("Mutiny", StringComparison.OrdinalIgnoreCase));
    }
}
```

## 2. Integration Tests

### Repository Tests

```csharp
public class KingdomRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;
    
    [Fact]
    public async Task Should_Save_And_Retrieve_Kingdom()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var repository = new KingdomRepository(context);
        var kingdom = new Kingdom("Integration Test Kingdom");
        
        // Act
        await repository.SaveAsync(kingdom);
        var retrieved = await repository.GetByIdAsync(kingdom.Id);
        
        // Assert
        retrieved.Should().NotBeNull();
        retrieved.Name.Should().Be("Integration Test Kingdom");
        retrieved.Resources.Should().BeEquivalentTo(kingdom.Resources);
    }
    
    [Fact]
    public async Task Should_Include_Related_Entities()
    {
        // Arrange
        using var context = _fixture.CreateContext();
        var repository = new KingdomRepository(context);
        var kingdom = new KingdomBuilder()
            .WithAdvisor(AdvisorType.Treasurer)
            .WithActiveEvent()
            .Build();
            
        await repository.SaveAsync(kingdom);
        
        // Act
        var retrieved = await repository.GetWithActiveEventsAsync(kingdom.Id);
        
        // Assert
        retrieved.Court.Advisors.Should().HaveCount(1);
        retrieved.ActiveEvents.Should().HaveCount(1);
    }
}
```

### API Tests

```csharp
public class KingdomApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    
    public KingdomApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }
    
    [Fact]
    public async Task POST_CreateKingdom_Should_Return_Created()
    {
        // Arrange
        var command = new CreateKingdomCommand
        {
            KingdomName = "API Test Kingdom",
            KingName = "King API",
            QueenName = "Queen API"
        };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/kingdoms", command);
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var kingdom = await response.Content.ReadFromJsonAsync<KingdomDto>();
        kingdom.Name.Should().Be("API Test Kingdom");
    }
    
    [Fact]
    public async Task POST_EventChoice_Should_Apply_Consequences()
    {
        // Arrange
        var kingdom = await CreateTestKingdom();
        var @event = await TriggerTestEvent(kingdom.Id);
        
        // Act
        var response = await _client.PostAsync(
            $"/api/kingdoms/{kingdom.Id}/events/{@event.Id}/choose",
            JsonContent.Create(new { choiceId = @event.Choices.First().Id }));
            
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<EventResultDto>();
        result.Success.Should().BeTrue();
        result.ConsequencesApplied.Should().NotBeEmpty();
    }
}
```

## 3. End-to-End Tests

```csharp
public class GameFlowE2ETests : IClassFixture<E2ETestFixture>
{
    [Fact]
    public async Task Complete_Prestige_Cycle()
    {
        // Arrange
        var client = _fixture.CreateAuthenticatedClient();
        
        // Act & Assert
        
        // 1. Create Kingdom
        var kingdom = await CreateKingdom(client, "E2E Test Kingdom");
        kingdom.Should().NotBeNull();
        
        // 2. Generate resources for 5 minutes
        await SimulateTime(client, kingdom.Id, minutes: 5);
        var state1 = await GetKingdomState(client, kingdom.Id);
        state1.Resources.Gold.Should().BeGreaterThan(100);
        
        // 3. Handle 10 events successfully
        for (int i = 0; i < 10; i++)
        {
            var @event = await WaitForEvent(client, kingdom.Id);
            await MakeEventChoice(client, kingdom.Id, @event.Id, @event.Choices.First().Id);
        }
        
        // 4. Check prestige availability
        var state2 = await GetKingdomState(client, kingdom.Id);
        state2.CanPrestige.Should().BeTrue();
        
        // 5. Perform prestige
        await PerformPrestige(client, kingdom.Id);
        
        // 6. Verify reset and bonuses
        var state3 = await GetKingdomState(client, kingdom.Id);
        state3.Resources.Gold.Should().Be(100); // Reset to starting
        state3.PrestigeLevel.Should().Be(1);
        state3.ResourceMultiplier.Should().Be(1.1m);
    }
    
    [Fact]
    public async Task Faction_Revolt_And_Recovery()
    {
        // Arrange
        var client = _fixture.CreateAuthenticatedClient();
        var kingdom = await CreateKingdom(client, "Revolt Test Kingdom");
        
        // Act
        // 1. Make choices that anger nobility
        await MakeUnpopularChoices(client, kingdom.Id, FactionType.Nobility, count: 5);
        
        // 2. Wait for revolt event
        var revoltEvent = await WaitForEventOfType(client, kingdom.Id, EventType.Military);
        revoltEvent.Title.Should().Contain("Noble Revolt");
        
        // 3. Choose to negotiate
        var negotiateChoice = revoltEvent.Choices
            .First(c => c.Description.Contains("Negotiate"));
        await MakeEventChoice(client, kingdom.Id, revoltEvent.Id, negotiateChoice.Id);
        
        // 4. Verify faction recovery
        var state = await GetKingdomState(client, kingdom.Id);
        state.Factions[FactionType.Nobility].Mood.Should().NotBe(FactionMood.Rebellious);
    }
}
```

## 4. Test Utilities and Builders

### Test Data Builders

```csharp
public class KingdomBuilder
{
    private string _name = "Test Kingdom";
    private int _prestigeLevel = 0;
    private Resources _resources = Resources.Default;
    private List<Advisor> _advisors = new();
    private List<KingdomEvent> _events = new();
    
    public KingdomBuilder WithName(string name)
    {
        _name = name;
        return this;
    }
    
    public KingdomBuilder WithPrestigeLevel(int level)
    {
        _prestigeLevel = level;
        return this;
    }
    
    public KingdomBuilder WithResources(decimal gold = 0, decimal influence = 0)
    {
        _resources = new Resources(gold, influence, 50, 100, 10);
        return this;
    }
    
    public KingdomBuilder WithAdvisor(AdvisorType type)
    {
        _advisors.Add(new Advisor($"Test {type}", type));
        return this;
    }
    
    public KingdomBuilder WithActiveEvent()
    {
        _events.Add(new EventBuilder().Build());
        return this;
    }
    
    public Kingdom Build()
    {
        var kingdom = new Kingdom(_name);
        
        // Use reflection or internal setters for testing
        typeof(Kingdom).GetProperty("PrestigeLevel")
            .SetValue(kingdom, _prestigeLevel);
            
        foreach (var advisor in _advisors)
        {
            kingdom.RecruitAdvisor(advisor.Type);
        }
        
        foreach (var @event in _events)
        {
            kingdom.TriggerEvent(@event);
        }
        
        return kingdom;
    }
}

public class EventBuilder
{
    private string _title = "Test Event";
    private string _description = "Test Description";
    private EventType _type = EventType.Political;
    private readonly List<EventChoice> _choices = new();
    
    public EventBuilder WithTitle(string title)
    {
        _title = title;
        return this;
    }
    
    public EventBuilder WithType(EventType type)
    {
        _type = type;
        return this;
    }
    
    public EventBuilder WithChoice(EventChoice choice)
    {
        _choices.Add(choice);
        return this;
    }
    
    public KingdomEvent Build()
    {
        var @event = _type switch
        {
            EventType.Political => new PoliticalEvent(_title, _description),
            EventType.Economic => new EconomicEvent(_title, _description),
            EventType.Military => new MilitaryEvent(_title, _description),
            EventType.Social => new SocialEvent(_title, _description),
            _ => throw new NotSupportedException()
        };
        
        if (!_choices.Any())
        {
            _choices.Add(new EventChoiceBuilder().Build());
            _choices.Add(new EventChoiceBuilder().Build());
        }
        
        foreach (var choice in _choices)
        {
            @event.AddChoice(choice);
        }
        
        return @event;
    }
}
```

### Custom Assertions

```csharp
public static class KingdomAssertions
{
    public static void ShouldHaveResources(
        this Kingdom kingdom, 
        decimal? gold = null,
        decimal? influence = null,
        decimal? loyalty = null)
    {
        if (gold.HasValue)
            kingdom.Resources.Gold.Should().Be(gold.Value);
        if (influence.HasValue)
            kingdom.Resources.Influence.Should().Be(influence.Value);
        if (loyalty.HasValue)
            kingdom.Resources.Loyalty.Should().Be(loyalty.Value);
    }
    
    public static void ShouldHaveFactionApproval(
        this Kingdom kingdom,
        FactionType faction,
        int minApproval)
    {
        kingdom.Factions[faction].ApprovalRating
            .Should().BeGreaterThanOrEqualTo(minApproval);
    }
}
```

### Test Fixtures

```csharp
public class DatabaseFixture : IDisposable
{
    private readonly string _connectionString;
    private readonly GameDbContext _context;
    
    public DatabaseFixture()
    {
        _connectionString = $"DataSource=test_{Guid.NewGuid()}.db";
        
        var options = new DbContextOptionsBuilder<GameDbContext>()
            .UseSqlite(_connectionString)
            .Options;
            
        _context = new GameDbContext(options);
        _context.Database.EnsureCreated();
    }
    
    public GameDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<GameDbContext>()
            .UseSqlite(_connectionString)
            .Options;
            
        return new GameDbContext(options);
    }
    
    public void Dispose()
    {
        _context?.Dispose();
        if (File.Exists(_connectionString.Replace("DataSource=", "")))
            File.Delete(_connectionString.Replace("DataSource=", ""));
    }
}
```

## 5. Test Organization

### Folder Structure
```
tests/
├── KingdomIncremental.Domain.Tests/
│   ├── Entities/
│   │   ├── KingdomTests.cs
│   │   ├── EventTests.cs
│   │   └── FactionTests.cs
│   ├── ValueObjects/
│   │   ├── ResourcesTests.cs
│   │   └── ResourceRequirementTests.cs
│   └── Services/
│       ├── EventGeneratorTests.cs
│       └── ResourceCalculatorTests.cs
├── KingdomIncremental.Application.Tests/
│   ├── Commands/
│   │   ├── CreateKingdomCommandHandlerTests.cs
│   │   └── MakeEventChoiceCommandHandlerTests.cs
│   └── Queries/
│       └── GetKingdomStateQueryHandlerTests.cs
├── KingdomIncremental.Infrastructure.Tests/
│   ├── Repositories/
│   │   └── KingdomRepositoryTests.cs
│   └── Services/
│       └── GameLoopServiceTests.cs
├── KingdomIncremental.WebAPI.Tests/
│   ├── Controllers/
│   │   └── KingdomControllerTests.cs
│   └── Integration/
│       └── ApiIntegrationTests.cs
└── KingdomIncremental.E2E.Tests/
    ├── Scenarios/
    │   ├── PrestigeCycleTests.cs
    │   └── FactionManagementTests.cs
    └── Fixtures/
        └── E2ETestFixture.cs
```

## 6. Continuous Testing

### Test Automation
```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 8.0.x
        
    - name: Restore dependencies
      run: dotnet restore
      
    - name: Build
      run: dotnet build --no-restore
      
    - name: Test
      run: dotnet test --no-build --verbosity normal --collect:"XPlat Code Coverage"
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Test Running Strategy
1. **Local Development**: Run affected tests on save
2. **Pre-commit**: Run unit tests for changed files
3. **Pull Request**: Run all unit and integration tests
4. **Main Branch**: Run full test suite including E2E