import { createNobleRebellionChain } from '../NobleRebellionChain';
import { createMerchantGuildChain } from '../MerchantGuildChain';
import { createReligiousAwakeningChain } from '../ReligiousAwakeningChain';
import { Resources } from '../../../value-objects/Resources';

describe('Event Chains', () => {
  describe('Noble Rebellion Chain', () => {
    let chain: ReturnType<typeof createNobleRebellionChain>;

    beforeEach(() => {
      chain = createNobleRebellionChain();
    });

    it('should create a chain with 3 events', () => {
      expect(chain).toHaveLength(3);
    });

    it('should have proper chain structure', () => {
      expect(chain[0].chainId).toBe('noble_rebellion');
      expect(chain[0].chainPosition).toBe(1);
      expect(chain[0].chainLength).toBe(3);
      expect(chain[0].previousEventId).toBeUndefined();
      expect(chain[0].nextEventId).toBeUndefined(); // Will be set by service

      expect(chain[1].chainId).toBe('noble_rebellion');
      expect(chain[1].chainPosition).toBe(2);
      expect(chain[1].previousEventId).toBe('noble_rebellion_1');

      expect(chain[2].chainId).toBe('noble_rebellion');
      expect(chain[2].chainPosition).toBe(3);
      expect(chain[2].previousEventId).toBe('noble_rebellion_2');
    });

    it('should have meaningful choices with different approaches', () => {
      const event1Choices = chain[0].choices;
      expect(event1Choices).toHaveLength(3);
      
      // Check for peaceful option
      const peacefulChoice = event1Choices.find(c => c.id === 'investigate_peacefully');
      expect(peacefulChoice).toBeDefined();
      expect(peacefulChoice?.immediateEffect.loyaltyChange).toBeGreaterThan(0);
      
      // Check for aggressive option
      const aggressiveChoice = event1Choices.find(c => c.id === 'show_force');
      expect(aggressiveChoice).toBeDefined();
      expect(aggressiveChoice?.immediateEffect.loyaltyChange).toBeLessThan(0);
    });

    it('should have chain data in choices', () => {
      chain.forEach(event => {
        event.choices.forEach(choice => {
          expect(choice.chainData).toBeDefined();
          expect(choice.chainData?.nextEventModifier).toBeDefined();
        });
      });
    });
  });

  describe('Merchant Guild Chain', () => {
    let chain: ReturnType<typeof createMerchantGuildChain>;

    beforeEach(() => {
      chain = createMerchantGuildChain();
    });

    it('should create a chain with 4 events', () => {
      expect(chain).toHaveLength(4);
    });

    it('should focus on economic choices', () => {
      chain.forEach(event => {
        // Most choices should have gold requirements or effects
        const hasEconomicFocus = event.choices.some(choice => 
          choice.requirements.gold > 0 || 
          choice.immediateEffect.resourceChange.gold !== 0
        );
        expect(hasEconomicFocus).toBe(true);
      });
    });

    it('should have escalating stakes', () => {
      // Check that later events have higher requirements
      const firstEventMaxGold = Math.max(...chain[0].choices.map(c => c.requirements.gold));
      const lastEventMaxGold = Math.max(...chain[3].choices.map(c => c.requirements.gold));
      expect(lastEventMaxGold).toBeGreaterThan(firstEventMaxGold);
    });
  });

  describe('Religious Awakening Chain', () => {
    let chain: ReturnType<typeof createReligiousAwakeningChain>;

    beforeEach(() => {
      chain = createReligiousAwakeningChain();
    });

    it('should create a chain with 3 events', () => {
      expect(chain).toHaveLength(3);
    });

    it('should focus on loyalty and influence', () => {
      chain.forEach(event => {
        const hasReligiousFocus = event.choices.some(choice => 
          choice.requirements.loyalty > 0 || 
          choice.requirements.influence > 0 ||
          choice.immediateEffect.loyaltyChange !== 0
        );
        expect(hasReligiousFocus).toBe(true);
      });
    });

    it('should have choices representing different religious stances', () => {
      const event1 = chain[0];
      
      // Should have embrace option
      const embraceChoice = event1.choices.find(c => c.id === 'embrace_prophet');
      expect(embraceChoice).toBeDefined();
      expect(embraceChoice?.immediateEffect.loyaltyChange).toBeGreaterThan(0);
      
      // Should have suppress option
      const suppressChoice = event1.choices.find(c => c.id === 'suppress_prophet');
      expect(suppressChoice).toBeDefined();
      expect(suppressChoice?.immediateEffect.loyaltyChange).toBeLessThan(0);
    });
  });

  describe('Chain Consequences', () => {
    it('should have meaningful immediate and long-term effects', () => {
      const chains = [
        createNobleRebellionChain(),
        createMerchantGuildChain(),
        createReligiousAwakeningChain()
      ];

      chains.forEach(chain => {
        chain.forEach(event => {
          event.choices.forEach(choice => {
            // Each choice should have immediate effects
            expect(choice.immediateEffect).toBeDefined();
            expect(choice.immediateEffect.description).toBeTruthy();
            
            // Final events should have more impactful consequences
            if (event.chainPosition === event.chainLength) {
              const totalResourceChange = Math.abs(choice.immediateEffect.resourceChange.gold) +
                                         Math.abs(choice.immediateEffect.resourceChange.influence) +
                                         Math.abs(choice.immediateEffect.resourceChange.loyalty) +
                                         Math.abs(choice.immediateEffect.resourceChange.population) +
                                         Math.abs(choice.immediateEffect.resourceChange.militaryPower);
              
              expect(totalResourceChange).toBeGreaterThan(100);
            }
          });
        });
      });
    });
  });
});