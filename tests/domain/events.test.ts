import { Event, EventType, EventChoice, ResourceRequirement, EventConsequence } from '../../src/domain/events/Event';
import { PoliticalEvent } from '../../src/domain/events/PoliticalEvent';
import { EconomicEvent } from '../../src/domain/events/EconomicEvent';
import { MilitaryEvent } from '../../src/domain/events/MilitaryEvent';
import { SocialEvent } from '../../src/domain/events/SocialEvent';
import { DiplomaticEvent } from '../../src/domain/events/DiplomaticEvent';
import { Resources } from '../../src/domain/value-objects/Resources';

describe('Event System', () => {
  describe('EventType Enum', () => {
    it('should have all required event types', () => {
      expect(EventType.Political).toBe('Political');
      expect(EventType.Economic).toBe('Economic');
      expect(EventType.Military).toBe('Military');
      expect(EventType.Social).toBe('Social');
      expect(EventType.Diplomatic).toBe('Diplomatic');
    });
  });

  describe('ResourceRequirement', () => {
    it('should create a valid resource requirement', () => {
      const requirement = new ResourceRequirement({
        gold: 100,
        influence: 10,
        loyalty: 0,
        population: 0,
        militaryPower: 0
      });

      expect(requirement.gold).toBe(100);
      expect(requirement.influence).toBe(10);
      expect(requirement.loyalty).toBe(0);
    });

    it('should check if resources meet requirement', () => {
      const requirement = new ResourceRequirement({
        gold: 100,
        influence: 10,
        loyalty: 0,
        population: 0,
        militaryPower: 0
      });

      const sufficientResources = new Resources(150, 20, 50, 1000, 10);
      const insufficientResources = new Resources(50, 5, 50, 1000, 10);

      expect(requirement.isSatisfiedBy(sufficientResources)).toBe(true);
      expect(requirement.isSatisfiedBy(insufficientResources)).toBe(false);
    });
  });

  describe('EventConsequence', () => {
    it('should create immediate and long-term consequences', () => {
      const consequence = new EventConsequence({
        resourceChange: new Resources(-50, 10, 0, 100, 0),
        stabilityChange: 5,
        loyaltyChange: -2,
        description: 'The people are happy with increased influence but question your spending'
      });

      expect(consequence.resourceChange.gold).toBe(-50);
      expect(consequence.resourceChange.influence).toBe(10);
      expect(consequence.stabilityChange).toBe(5);
      expect(consequence.loyaltyChange).toBe(-2);
      expect(consequence.description).toBe('The people are happy with increased influence but question your spending');
    });
  });

  describe('EventChoice', () => {
    it('should create a valid event choice', () => {
      const choice = new EventChoice({ id: 'test-choice-id',
        description: 'Distribute gold to the people',
        requirements: new ResourceRequirement({ gold: 100, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
        immediateEffect: new EventConsequence({
          resourceChange: new Resources(-100, 0, 5, 0, 0),
          stabilityChange: 10,
          loyaltyChange: 5,
          description: 'The people rejoice!'
        }),
        longTermEffects: [
          new EventConsequence({
            resourceChange: new Resources(5, 1, 0, 0, 0),
            stabilityChange: 0,
            loyaltyChange: 1,
            description: 'Increased trade from happy citizens'
          })
        ]
      });

      expect(choice.description).toBe('Distribute gold to the people');
      expect(choice.immediateEffect.stabilityChange).toBe(10);
      expect(choice.longTermEffects).toHaveLength(1);
    });

    it('should validate choice requirements', () => {
      const choice = new EventChoice({ id: 'test-choice-id',
        description: 'Build a monument',
        requirements: new ResourceRequirement({ gold: 500, influence: 20, loyalty: 0, population: 500, militaryPower: 10 }),
        immediateEffect: new EventConsequence({
          resourceChange: new Resources(-500, -20, 10, 0, 0),
          stabilityChange: 0,
          loyaltyChange: 10,
          description: 'Monument construction begins'
        }),
        longTermEffects: []
      });

      const sufficientResources = new Resources(1000, 30, 50, 1000, 20);
      const insufficientResources = new Resources(100, 10, 50, 1000, 20);

      expect(choice.canBeChosen(sufficientResources)).toBe(true);
      expect(choice.canBeChosen(insufficientResources)).toBe(false);
    });
  });

  describe('Event Abstract Class', () => {
    class TestEvent extends Event {
      constructor(id: string, title: string, description: string, choices: EventChoice[], expiresAt?: Date) {
        super(id, title, description, EventType.Political, choices, expiresAt);
      }
    }

    it('should create an event with required properties', () => {
      const choices = [
        new EventChoice({ id: 'test-choice-id',
          description: 'Accept',
          requirements: new ResourceRequirement({ gold: 0, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources(0, 0, 0, 0, 0),
            stabilityChange: 5,
            loyaltyChange: 0,
            description: 'You accept the proposal'
          }),
          longTermEffects: []
        })
      ];

      const event = new TestEvent('evt-1', 'Test Event', 'A test event description', choices);

      expect(event.id).toBe('evt-1');
      expect(event.title).toBe('Test Event');
      expect(event.description).toBe('A test event description');
      expect(event.type).toBe(EventType.Political);
      expect(event.choices).toHaveLength(1);
    });

    it('should check if event has expired', () => {
      const choices = [
        new EventChoice({ id: 'test-choice-id',
          description: 'Accept',
          requirements: new ResourceRequirement({ gold: 0, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources(0, 0, 0, 0, 0),
            stabilityChange: 0,
            loyaltyChange: 0,
            description: 'Accepted'
          }),
          longTermEffects: []
        })
      ];

      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const activeEvent = new TestEvent('evt-1', 'Active Event', 'This event is still active', choices, futureDate);
      const expiredEvent = new TestEvent('evt-2', 'Expired Event', 'This event has expired', choices, pastDate);
      const permanentEvent = new TestEvent('evt-3', 'Permanent Event', 'This event never expires', choices);

      expect(activeEvent.isExpired()).toBe(false);
      expect(expiredEvent.isExpired()).toBe(true);
      expect(permanentEvent.isExpired()).toBe(false);
    });

    it('should return available choices based on resources', () => {
      const choices = [
        new EventChoice({ id: 'test-choice-id',
          description: 'Cheap option',
          requirements: new ResourceRequirement({ gold: 10, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources(-10, 0, 0, 0, 0),
            stabilityChange: 1,
            loyaltyChange: 0,
            description: 'A modest choice'
          }),
          longTermEffects: []
        }),
        new EventChoice({ id: 'test-choice-id',
          description: 'Expensive option',
          requirements: new ResourceRequirement({ gold: 1000, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources(-1000, 0, 0, 0, 0),
            stabilityChange: 10,
            loyaltyChange: 5,
            description: 'A grand choice'
          }),
          longTermEffects: []
        })
      ];

      const event = new TestEvent('evt-1', 'Resource Test', 'Testing available choices', choices);
      const poorResources = new Resources(50, 10, 50, 1000, 10);
      const richResources = new Resources(2000, 10, 50, 1000, 10);

      expect(event.getAvailableChoices(poorResources)).toHaveLength(1);
      expect(event.getAvailableChoices(richResources)).toHaveLength(2);
    });
  });

  describe('Concrete Event Implementations', () => {
    describe('PoliticalEvent', () => {
      it('should create a political event', () => {
        const choices = [
          new EventChoice({ id: 'test-choice-id',
            description: 'Support the nobles',
            requirements: new ResourceRequirement({ gold: 100, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
            immediateEffect: new EventConsequence({
              resourceChange: new Resources(-100, 5, 0, 0, 0),
              stabilityChange: -5,
              loyaltyChange: 10,
              description: 'The nobles are pleased'
            }),
            longTermEffects: []
          })
        ];

        const event = new PoliticalEvent('pol-1', 'Noble Dispute', 'The nobles demand your support', choices);
        expect(event.type).toBe(EventType.Political);
      });
    });

    describe('EconomicEvent', () => {
      it('should create an economic event', () => {
        const choices = [
          new EventChoice({ id: 'test-choice-id',
            description: 'Invest in trade routes',
            requirements: new ResourceRequirement({ gold: 500, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
            immediateEffect: new EventConsequence({
              resourceChange: new Resources(-500, 0, 0, 0, 0),
              stabilityChange: 0,
              loyaltyChange: 0,
              description: 'Trade routes established'
            }),
            longTermEffects: [
              new EventConsequence({
                resourceChange: new Resources(50, 2, 0, 10, 0),
                stabilityChange: 1,
                loyaltyChange: 0,
                description: 'Trade income increases'
              })
            ]
          })
        ];

        const event = new EconomicEvent('eco-1', 'Trade Opportunity', 'Merchants offer new trade routes', choices);
        expect(event.type).toBe(EventType.Economic);
      });
    });

    describe('MilitaryEvent', () => {
      it('should create a military event', () => {
        const choices = [
          new EventChoice({ id: 'test-choice-id',
            description: 'Train new soldiers',
            requirements: new ResourceRequirement({ gold: 200, influence: 0, loyalty: 0, population: 100, militaryPower: 0 }),
            immediateEffect: new EventConsequence({
              resourceChange: new Resources(-200, 0, 0, -100, 5),
              stabilityChange: 5,
              loyaltyChange: 0,
              description: 'New soldiers recruited'
            }),
            longTermEffects: []
          })
        ];

        const event = new MilitaryEvent('mil-1', 'Military Recruitment', 'The army needs reinforcements', choices);
        expect(event.type).toBe(EventType.Military);
      });
    });

    describe('SocialEvent', () => {
      it('should create a social event', () => {
        const choices = [
          new EventChoice({ 
            id: 'choice-1',
            description: 'Host a festival',
            requirements: new ResourceRequirement({ gold: 300, influence: 10, loyalty: 0, population: 0, militaryPower: 0 }),
            immediateEffect: new EventConsequence({
              resourceChange: new Resources(-300, -10, 15, 0, 0),
              stabilityChange: 10,
              loyaltyChange: 15,
              description: 'The people celebrate'
            }),
            longTermEffects: []
          })
        ];

        const event = new SocialEvent('soc-1', 'Festival Request', 'The people want a celebration', choices);
        expect(event.type).toBe(EventType.Social);
      });
    });

    describe('DiplomaticEvent', () => {
      it('should create a diplomatic event', () => {
        const choices = [
          new EventChoice({ id: 'test-choice-id',
            description: 'Accept the alliance',
            requirements: new ResourceRequirement({ gold: 0, influence: 0, loyalty: 0, population: 0, militaryPower: 0 }),
            immediateEffect: new EventConsequence({
              resourceChange: new Resources(0, 0, 0, 0, 0),
              stabilityChange: 5,
              loyaltyChange: 0,
              description: 'Alliance formed'
            }),
            longTermEffects: [
              new EventConsequence({
                resourceChange: new Resources(10, 3, 0, 0, 2),
                stabilityChange: 0,
                loyaltyChange: 0,
                description: 'Trade benefits from alliance'
              })
            ]
          })
        ];

        const event = new DiplomaticEvent('dip-1', 'Alliance Proposal', 'A neighboring kingdom offers alliance', choices);
        expect(event.type).toBe(EventType.Diplomatic);
      });
    });
  });
});