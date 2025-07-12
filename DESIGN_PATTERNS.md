# Design Patterns & Architectural Decisions

## 1. Domain-Driven Design Patterns

### Aggregate Pattern
```csharp
// Kingdom is our main Aggregate Root
public class Kingdom : AggregateRoot
{
    private readonly List<DomainEvent> _domainEvents = new();
    
    // All changes go through the aggregate root
    public EventResult MakeEventChoice(Guid eventId, Guid choiceId)
    {
        var @event = GetActiveEvent(eventId);
        if (@event == null)
            throw new EventNotFoundException(eventId);
            
        var choice = @event.GetChoice(choiceId);
        if (!CanAfford(choice.Requirements))
            throw new InsufficientResourcesException();
            
        var result = choice.Execute(this);
        
        // Raise domain event
        AddDomainEvent(new EventChoiceMadeEvent(Id, eventId, choiceId, result));
        
        return result;
    }
    
    private void AddDomainEvent(DomainEvent @event)
    {
        _domainEvents.Add(@event);
    }
}
```

### Value Objects
```csharp
public record Resources(
    decimal Gold,
    decimal Influence,
    decimal Loyalty,
    int Population,
    decimal MilitaryPower
) : IValueObject
{
    public static Resources Zero => new(0, 0, 0, 0, 0);
    
    public static Resources operator +(Resources a, Resources b) =>
        new(a.Gold + b.Gold,
            a.Influence + b.Influence,
            a.Loyalty + b.Loyalty,
            a.Population + b.Population,
            a.MilitaryPower + b.MilitaryPower);
            
    public static Resources operator *(Resources r, decimal multiplier) =>
        new(r.Gold * multiplier,
            r.Influence * multiplier,
            r.Loyalty * multiplier,
            (int)(r.Population * multiplier),
            r.MilitaryPower * multiplier);
            
    public bool CanAfford(ResourceRequirement requirement) =>
        (!requirement.Gold.HasValue || Gold >= requirement.Gold) &&
        (!requirement.Influence.HasValue || Influence >= requirement.Influence) &&
        (!requirement.Loyalty.HasValue || Loyalty >= requirement.Loyalty) &&
        (!requirement.Population.HasValue || Population >= requirement.Population) &&
        (!requirement.MilitaryPower.HasValue || MilitaryPower >= requirement.MilitaryPower);
}
```

### Repository Pattern
```csharp
public interface IKingdomRepository : IRepository<Kingdom>
{
    Task<Kingdom?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Kingdom?> GetWithActiveEventsAsync(Guid id, CancellationToken ct = default);
    Task<List<Kingdom>> GetActiveKingdomsAsync(CancellationToken ct = default);
}

public class KingdomRepository : IKingdomRepository
{
    private readonly GameDbContext _context;
    
    public async Task<Kingdom?> GetWithActiveEventsAsync(Guid id, CancellationToken ct)
    {
        return await _context.Kingdoms
            .Include(k => k.ActiveEvents)
            .Include(k => k.Factions)
            .Include(k => k.Court.Advisors)
            .AsSplitQuery()
            .FirstOrDefaultAsync(k => k.Id == id, ct);
    }
}
```

## 2. Event Sourcing Pattern (Partial)

### Event Store for Audit Trail
```csharp
public interface IEventStore
{
    Task AppendAsync(DomainEvent @event, CancellationToken ct = default);
    Task<List<DomainEvent>> GetEventsAsync(Guid aggregateId, CancellationToken ct = default);
}

public class EventStore : IEventStore
{
    private readonly IEventStoreDbContext _context;
    
    public async Task AppendAsync(DomainEvent @event, CancellationToken ct)
    {
        var eventData = new StoredEvent
        {
            AggregateId = @event.AggregateId,
            EventType = @event.GetType().Name,
            EventData = JsonSerializer.Serialize(@event),
            OccurredAt = @event.OccurredAt
        };
        
        _context.Events.Add(eventData);
        await _context.SaveChangesAsync(ct);
    }
}
```

## 3. Strategy Pattern for Event Generation

```csharp
public interface IEventGenerationStrategy
{
    bool CanGenerate(Kingdom kingdom);
    KingdomEvent Generate(Kingdom kingdom);
    float GetProbability(Kingdom kingdom);
}

public class LowLoyaltyEventStrategy : IEventGenerationStrategy
{
    public bool CanGenerate(Kingdom kingdom) => 
        kingdom.Resources.Loyalty < 30;
        
    public KingdomEvent Generate(Kingdom kingdom)
    {
        return new SocialEvent(
            "Peasant Unrest",
            "The common folk grow restless due to low loyalty.",
            new List<EventChoice>
            {
                new EventChoice("Distribute Gold", 
                    new ResourceRequirement { Gold = 100 },
                    new EventConsequence { 
                        ResourceChanges = new Resources(Gold: -100, Loyalty: 20),
                        FactionEffects = new() { { FactionType.Commoners, 10 } }
                    }),
                new EventChoice("Use Military Force",
                    new ResourceRequirement { MilitaryPower = 50 },
                    new EventConsequence {
                        ResourceChanges = new Resources(Loyalty: 10, MilitaryPower: -10),
                        FactionEffects = new() { 
                            { FactionType.Military, 5 },
                            { FactionType.Commoners, -20 }
                        }
                    })
            }
        );
    }
    
    public float GetProbability(Kingdom kingdom) => 
        Math.Max(0.7f, 1f - (kingdom.Resources.Loyalty / 100f));
}

public class EventGeneratorService : IEventGenerator
{
    private readonly List<IEventGenerationStrategy> _strategies;
    
    public KingdomEvent GenerateRandomEvent(Kingdom kingdom)
    {
        var applicableStrategies = _strategies
            .Where(s => s.CanGenerate(kingdom))
            .ToList();
            
        if (!applicableStrategies.Any())
            return GenerateDefaultEvent(kingdom);
            
        var strategy = SelectWeightedRandom(applicableStrategies, kingdom);
        return strategy.Generate(kingdom);
    }
}
```

## 4. Observer Pattern for Event System

```csharp
public interface IEventObserver
{
    void OnEventTriggered(KingdomEvent @event, Kingdom kingdom);
    void OnEventResolved(EventResult result, Kingdom kingdom);
}

public class FactionEventObserver : IEventObserver
{
    public void OnEventTriggered(KingdomEvent @event, Kingdom kingdom)
    {
        // Check if any factions should react to this event
        foreach (var faction in kingdom.Factions.Values)
        {
            if (ShouldFactionReact(@event, faction))
            {
                // Modify faction mood based on event type
                faction.ReactToEvent(@event);
            }
        }
    }
    
    public void OnEventResolved(EventResult result, Kingdom kingdom)
    {
        // Apply faction consequences from the event result
        foreach (var (factionType, change) in result.FactionChanges)
        {
            kingdom.Factions[factionType].ModifyApproval(change);
        }
    }
}
```

## 5. Chain of Responsibility for Event Validation

```csharp
public abstract class EventValidationHandler
{
    protected EventValidationHandler? _next;
    
    public EventValidationHandler SetNext(EventValidationHandler next)
    {
        _next = next;
        return next;
    }
    
    public virtual ValidationResult Validate(EventChoice choice, Kingdom kingdom)
    {
        if (_next != null)
            return _next.Validate(choice, kingdom);
            
        return ValidationResult.Success();
    }
}

public class ResourceValidationHandler : EventValidationHandler
{
    public override ValidationResult Validate(EventChoice choice, Kingdom kingdom)
    {
        if (!kingdom.CanAfford(choice.Requirements))
            return ValidationResult.Failure("Insufficient resources");
            
        return base.Validate(choice, kingdom);
    }
}

public class AdvisorValidationHandler : EventValidationHandler
{
    public override ValidationResult Validate(EventChoice choice, Kingdom kingdom)
    {
        if (choice.RequiredAdvisor.HasValue && 
            !kingdom.Court.HasAdvisor(choice.RequiredAdvisor.Value))
            return ValidationResult.Failure($"Requires {choice.RequiredAdvisor} advisor");
            
        return base.Validate(choice, kingdom);
    }
}

// Usage
var validationChain = new ResourceValidationHandler();
validationChain.SetNext(new AdvisorValidationHandler())
               .SetNext(new FactionRequirementHandler());
```

## 6. State Pattern for Event Lifecycle

```csharp
public interface IEventState
{
    bool CanTransitionTo(IEventState newState);
    void OnEnter(KingdomEvent @event);
    void OnExit(KingdomEvent @event);
    EventStateType StateType { get; }
}

public class ActiveEventState : IEventState
{
    public EventStateType StateType => EventStateType.Active;
    
    public bool CanTransitionTo(IEventState newState) =>
        newState.StateType == EventStateType.Resolved ||
        newState.StateType == EventStateType.Expired ||
        newState.StateType == EventStateType.Cancelled;
        
    public void OnEnter(KingdomEvent @event)
    {
        @event.ActivatedAt = DateTime.UtcNow;
    }
    
    public void OnExit(KingdomEvent @event) { }
}

public abstract class KingdomEvent
{
    private IEventState _currentState = new CreatedEventState();
    
    public void TransitionTo(IEventState newState)
    {
        if (!_currentState.CanTransitionTo(newState))
            throw new InvalidStateTransitionException();
            
        _currentState.OnExit(this);
        _currentState = newState;
        _currentState.OnEnter(this);
    }
}
```

## 7. Factory Pattern for Event Creation

```csharp
public interface IEventFactory
{
    KingdomEvent CreateEvent(EventTemplate template, Kingdom kingdom);
}

public class EventFactory : IEventFactory
{
    private readonly Dictionary<EventType, Func<EventTemplate, Kingdom, KingdomEvent>> _creators;
    
    public EventFactory()
    {
        _creators = new Dictionary<EventType, Func<EventTemplate, Kingdom, KingdomEvent>>
        {
            [EventType.Political] = CreatePoliticalEvent,
            [EventType.Economic] = CreateEconomicEvent,
            [EventType.Military] = CreateMilitaryEvent,
            [EventType.Social] = CreateSocialEvent
        };
    }
    
    public KingdomEvent CreateEvent(EventTemplate template, Kingdom kingdom)
    {
        if (!_creators.TryGetValue(template.Type, out var creator))
            throw new UnsupportedEventTypeException(template.Type);
            
        var @event = creator(template, kingdom);
        CustomizeEventForKingdom(@event, kingdom);
        return @event;
    }
    
    private void CustomizeEventForKingdom(KingdomEvent @event, Kingdom kingdom)
    {
        // Add advisor-specific choices
        if (kingdom.Court.HasAdvisor(AdvisorType.Spymaster))
        {
            @event.AddChoice(CreateSpymasterChoice());
        }
        
        // Modify based on faction relations
        foreach (var faction in kingdom.Factions.Values.Where(f => f.Mood == FactionMood.Loyal))
        {
            @event.ModifyChoicesForLoyalFaction(faction);
        }
    }
}
```

## 8. Specification Pattern for Complex Queries

```csharp
public interface ISpecification<T>
{
    bool IsSatisfiedBy(T entity);
    Expression<Func<T, bool>> ToExpression();
}

public class ActiveEventsSpecification : ISpecification<KingdomEvent>
{
    private readonly DateTime _currentTime;
    
    public ActiveEventsSpecification(DateTime currentTime)
    {
        _currentTime = currentTime;
    }
    
    public bool IsSatisfiedBy(KingdomEvent entity) =>
        entity.Status == EventStatus.Active && 
        entity.ExpiresAt > _currentTime;
        
    public Expression<Func<KingdomEvent, bool>> ToExpression() =>
        e => e.Status == EventStatus.Active && e.ExpiresAt > _currentTime;
}

public class CompositeSpecification<T> : ISpecification<T>
{
    private readonly ISpecification<T> _left;
    private readonly ISpecification<T> _right;
    private readonly Func<Expression, Expression, Expression> _merge;
    
    public ISpecification<T> And(ISpecification<T> specification) =>
        new CompositeSpecification<T>(this, specification, Expression.AndAlso);
        
    public ISpecification<T> Or(ISpecification<T> specification) =>
        new CompositeSpecification<T>(this, specification, Expression.OrElse);
}
```

## 9. Memento Pattern for Save System

```csharp
public class KingdomMemento
{
    public Guid Id { get; init; }
    public string Name { get; init; }
    public Resources Resources { get; init; }
    public Dictionary<FactionType, FactionMemento> Factions { get; init; }
    public int PrestigeLevel { get; init; }
    public DateTime SavedAt { get; init; }
    
    public KingdomMemento(Kingdom kingdom)
    {
        Id = kingdom.Id;
        Name = kingdom.Name;
        Resources = kingdom.Resources;
        Factions = kingdom.Factions.ToDictionary(
            kvp => kvp.Key,
            kvp => new FactionMemento(kvp.Value)
        );
        PrestigeLevel = kingdom.PrestigeLevel;
        SavedAt = DateTime.UtcNow;
    }
}

public class SaveGameService
{
    public async Task<string> CreateSaveAsync(Kingdom kingdom)
    {
        var memento = new KingdomMemento(kingdom);
        var json = JsonSerializer.Serialize(memento, new JsonSerializerOptions
        {
            WriteIndented = true,
            Converters = { new ResourcesJsonConverter() }
        });
        
        var saveId = Guid.NewGuid().ToString();
        await _storage.SaveAsync($"saves/{saveId}.json", json);
        return saveId;
    }
}
```

## 10. Mediator Pattern with MediatR

```csharp
public class MakeEventChoiceCommand : IRequest<Result<EventResultDto>>
{
    public Guid KingdomId { get; init; }
    public Guid EventId { get; init; }
    public Guid ChoiceId { get; init; }
}

public class MakeEventChoiceCommandHandler : IRequestHandler<MakeEventChoiceCommand, Result<EventResultDto>>
{
    private readonly IKingdomRepository _repository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<MakeEventChoiceCommandHandler> _logger;
    
    public async Task<Result<EventResultDto>> Handle(
        MakeEventChoiceCommand request, 
        CancellationToken ct)
    {
        var kingdom = await _repository.GetWithActiveEventsAsync(request.KingdomId, ct);
        if (kingdom == null)
            return Result<EventResultDto>.Failure("Kingdom not found");
            
        try
        {
            var result = kingdom.MakeEventChoice(request.EventId, request.ChoiceId);
            
            await _repository.SaveAsync(kingdom, ct);
            await _eventBus.PublishAsync(new EventChoiceMadeEvent(
                kingdom.Id, request.EventId, request.ChoiceId, result), ct);
                
            return Result<EventResultDto>.Success(EventResultDto.FromDomain(result));
        }
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, "Domain exception in event choice");
            return Result<EventResultDto>.Failure(ex.Message);
        }
    }
}
```

## 11. Decorator Pattern for Resource Calculation

```csharp
public interface IResourceCalculator
{
    ResourceGeneration Calculate(Kingdom kingdom);
}

public class BaseResourceCalculator : IResourceCalculator
{
    public ResourceGeneration Calculate(Kingdom kingdom)
    {
        var king = kingdom.Court.King.GetResourceGeneration();
        var queen = kingdom.Court.Queen.GetResourceGeneration();
        
        return king.Add(queen);
    }
}

public class AdvisorResourceDecorator : IResourceCalculator
{
    private readonly IResourceCalculator _inner;
    
    public AdvisorResourceDecorator(IResourceCalculator inner)
    {
        _inner = inner;
    }
    
    public ResourceGeneration Calculate(Kingdom kingdom)
    {
        var baseGeneration = _inner.Calculate(kingdom);
        
        foreach (var advisor in kingdom.Court.Advisors.Values)
        {
            baseGeneration = baseGeneration.Add(advisor.GetResourceGeneration());
        }
        
        return baseGeneration;
    }
}

public class PrestigeResourceDecorator : IResourceCalculator
{
    private readonly IResourceCalculator _inner;
    
    public ResourceGeneration Calculate(Kingdom kingdom)
    {
        var baseGeneration = _inner.Calculate(kingdom);
        var multiplier = 1m + (kingdom.PrestigeLevel * 0.1m);
        
        return baseGeneration.Multiply(multiplier);
    }
}

// Usage
var calculator = new PrestigeResourceDecorator(
    new AdvisorResourceDecorator(
        new ModifierResourceDecorator(
            new BaseResourceCalculator())));
```

## 12. Template Method Pattern for Event Processing

```csharp
public abstract class EventProcessor
{
    public EventResult ProcessEvent(KingdomEvent @event, EventChoice choice, Kingdom kingdom)
    {
        // Template method defining the algorithm
        ValidateEvent(@event, kingdom);
        ValidateChoice(choice, kingdom);
        
        var cost = CalculateCost(choice, kingdom);
        DeductResources(cost, kingdom);
        
        var consequences = ApplyImmediateEffects(choice, kingdom);
        ScheduleLongTermEffects(choice, kingdom);
        
        var chainEvents = CheckForChainEvents(choice, kingdom);
        foreach (var chainEvent in chainEvents)
        {
            kingdom.TriggerEvent(chainEvent);
        }
        
        RecordHistory(@event, choice, kingdom);
        
        return CreateResult(consequences, chainEvents);
    }
    
    protected abstract void ValidateEvent(KingdomEvent @event, Kingdom kingdom);
    protected abstract ResourceRequirement CalculateCost(EventChoice choice, Kingdom kingdom);
    protected abstract EventConsequence ApplyImmediateEffects(EventChoice choice, Kingdom kingdom);
    protected abstract List<KingdomEvent> CheckForChainEvents(EventChoice choice, Kingdom kingdom);
    
    protected virtual void ValidateChoice(EventChoice choice, Kingdom kingdom)
    {
        if (!choice.IsAvailable(kingdom))
            throw new InvalidChoiceException();
    }
    
    protected virtual void DeductResources(ResourceRequirement cost, Kingdom kingdom)
    {
        kingdom.SpendResources(cost);
    }
}
```

## 13. Null Object Pattern for Missing Advisors

```csharp
public interface IAdvisor
{
    AdvisorType Type { get; }
    ResourceGeneration GetResourceGeneration();
    decimal GetBonus(BonusType bonusType);
    bool CanUnlockChoice(EventChoice choice);
}

public class NullAdvisor : IAdvisor
{
    public AdvisorType Type => AdvisorType.None;
    
    public ResourceGeneration GetResourceGeneration() => ResourceGeneration.Zero;
    
    public decimal GetBonus(BonusType bonusType) => 1m;
    
    public bool CanUnlockChoice(EventChoice choice) => false;
}

public class RoyalCourt
{
    private readonly Dictionary<AdvisorType, IAdvisor> _advisors = new();
    
    public IAdvisor GetAdvisor(AdvisorType type) =>
        _advisors.GetValueOrDefault(type, new NullAdvisor());
}
```

## 14. Unit of Work Pattern

```csharp
public interface IUnitOfWork : IDisposable
{
    IKingdomRepository Kingdoms { get; }
    IEventRepository Events { get; }
    Task<int> CompleteAsync(CancellationToken ct = default);
    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken ct = default);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly GameDbContext _context;
    private readonly Lazy<IKingdomRepository> _kingdoms;
    private readonly Lazy<IEventRepository> _events;
    
    public UnitOfWork(GameDbContext context)
    {
        _context = context;
        _kingdoms = new Lazy<IKingdomRepository>(() => new KingdomRepository(_context));
        _events = new Lazy<IEventRepository>(() => new EventRepository(_context));
    }
    
    public IKingdomRepository Kingdoms => _kingdoms.Value;
    public IEventRepository Events => _events.Value;
    
    public async Task<int> CompleteAsync(CancellationToken ct = default)
    {
        return await _context.SaveChangesAsync(ct);
    }
}
```

## 15. Result Pattern for Error Handling

```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T Value { get; }
    public string Error { get; }
    public List<ValidationError> ValidationErrors { get; }
    
    private Result(bool isSuccess, T value, string error, List<ValidationError> validationErrors)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;
        ValidationErrors = validationErrors ?? new List<ValidationError>();
    }
    
    public static Result<T> Success(T value) => 
        new(true, value, null, null);
        
    public static Result<T> Failure(string error) => 
        new(false, default, error, null);
        
    public static Result<T> ValidationFailure(List<ValidationError> errors) => 
        new(false, default, "Validation failed", errors);
        
    public Result<TNew> Map<TNew>(Func<T, TNew> mapper) =>
        IsSuccess 
            ? Result<TNew>.Success(mapper(Value))
            : Result<TNew>.Failure(Error);
            
    public async Task<Result<TNew>> MapAsync<TNew>(Func<T, Task<TNew>> mapper) =>
        IsSuccess 
            ? Result<TNew>.Success(await mapper(Value))
            : Result<TNew>.Failure(Error);
}
```