import { describe, expect, test } from '@jest/globals';
import { Kingdom } from '../../src/domain/entities/Kingdom';
import { ResourceGenerator } from '../../src/domain/services/ResourceGenerator';
import { ResourceType } from '../../src/domain/value-objects/ResourceType';
import { CharacterType } from '../../src/domain/value-objects/CharacterType';
import { AdvisorType } from '../../src/domain/value-objects/AdvisorType';

describe('ResourceGenerator', () => {
  describe('Basic Generation', () => {
    test('King generates 1 gold per second', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.KING);
      
      const generator = new ResourceGenerator();
      const rates = generator.calculateGenerationRates(kingdom);
      
      expect(rates.get(ResourceType.GOLD)).toBe(1);
    });

    test('Queen generates 1 influence per second', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.QUEEN);
      
      const generator = new ResourceGenerator();
      const rates = generator.calculateGenerationRates(kingdom);
      
      expect(rates.get(ResourceType.INFLUENCE)).toBe(1);
    });

    test('King and Queen generate combined resources', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.KING);
      kingdom.addCharacter(CharacterType.QUEEN);
      
      const generator = new ResourceGenerator();
      const rates = generator.calculateGenerationRates(kingdom);
      
      expect(rates.get(ResourceType.GOLD)).toBe(1);
      expect(rates.get(ResourceType.INFLUENCE)).toBe(1);
    });
  });

  describe('Offline Progression', () => {
    test('calculates offline progress for 10 seconds', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.KING);
      kingdom.addCharacter(CharacterType.QUEEN);
      
      const generator = new ResourceGenerator();
      const progress = generator.calculateOfflineProgress(kingdom, 10);
      
      expect(progress.get(ResourceType.GOLD)).toBe(10);
      expect(progress.get(ResourceType.INFLUENCE)).toBe(10);
    });

    test('calculates offline progress with no characters', () => {
      const kingdom = new Kingdom('Test Kingdom');
      
      const generator = new ResourceGenerator();
      const progress = generator.calculateOfflineProgress(kingdom, 10);
      
      expect(progress.get(ResourceType.GOLD)).toBe(0);
      expect(progress.get(ResourceType.INFLUENCE)).toBe(0);
    });
  });

  describe('Advisor Bonuses', () => {
    test('Treasurer adds 50% gold generation bonus', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.KING);
      kingdom.addAdvisor(AdvisorType.TREASURER);
      
      const generator = new ResourceGenerator();
      const rates = generator.calculateGenerationRates(kingdom);
      
      expect(rates.get(ResourceType.GOLD)).toBe(1.5);
    });

    test('Treasurer bonus applies to multiple gold generators', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.KING);
      kingdom.addCharacter(CharacterType.KING); // Assuming multiple kings possible
      kingdom.addAdvisor(AdvisorType.TREASURER);
      
      const generator = new ResourceGenerator();
      const rates = generator.calculateGenerationRates(kingdom);
      
      expect(rates.get(ResourceType.GOLD)).toBe(3); // 2 * 1.5
    });

    test('Treasurer does not affect influence generation', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.QUEEN);
      kingdom.addAdvisor(AdvisorType.TREASURER);
      
      const generator = new ResourceGenerator();
      const rates = generator.calculateGenerationRates(kingdom);
      
      expect(rates.get(ResourceType.INFLUENCE)).toBe(1);
    });
  });

  describe('Generation Limits', () => {
    test('respects maximum resource limits', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.KING);
      
      // Set current gold to exactly 9999 (accounting for initial gold)
      const initialGold = kingdom.getResource(ResourceType.GOLD);
      // First, we need to get to exactly 9999
      kingdom.addResource(ResourceType.GOLD, 9999 - initialGold);
      
      const generator = new ResourceGenerator();
      
      // Check generation rates first
      const rates = generator.calculateGenerationRates(kingdom);
      const goldRate = rates.get(ResourceType.GOLD) || 0;
      
      const progress = generator.calculateOfflineProgress(kingdom, 10);
      
      // Should only generate 1 gold to reach the 10000 limit
      // With a king, gold rate should be 1 per second, so 10 seconds = 10 gold
      // But we can only add 1 to reach 10000
      const expectedGold = Math.min(goldRate * 10, 10000 - 9999);
      expect(progress.get(ResourceType.GOLD)).toBe(expectedGold);
    });

    test('does not generate resources when at maximum', () => {
      const kingdom = new Kingdom('Test Kingdom');
      kingdom.addCharacter(CharacterType.KING);
      
      // Set current gold to max
      kingdom.addResource(ResourceType.GOLD, 10000);
      
      const generator = new ResourceGenerator();
      const progress = generator.calculateOfflineProgress(kingdom, 10);
      
      expect(progress.get(ResourceType.GOLD)).toBe(0);
    });
  });
});

describe('Kingdom Resource Generation', () => {
  test('calculateResourceGeneration updates resources based on time', () => {
    const kingdom = new Kingdom('Test Kingdom');
    kingdom.addCharacter(CharacterType.KING);
    kingdom.addCharacter(CharacterType.QUEEN);
    
    const initialGold = kingdom.getResource(ResourceType.GOLD);
    const initialInfluence = kingdom.getResource(ResourceType.INFLUENCE);
    
    kingdom.calculateResourceGeneration(5);
    
    expect(kingdom.getResource(ResourceType.GOLD)).toBe(initialGold + 5);
    expect(kingdom.getResource(ResourceType.INFLUENCE)).toBe(initialInfluence + 5);
  });

  test('getGenerationRates returns current generation rates', () => {
    const kingdom = new Kingdom('Test Kingdom');
    kingdom.addCharacter(CharacterType.KING);
    kingdom.addCharacter(CharacterType.QUEEN);
    
    const rates = kingdom.getGenerationRates();
    
    expect(rates.get(ResourceType.GOLD)).toBe(1);
    expect(rates.get(ResourceType.INFLUENCE)).toBe(1);
  });

  test('tracks last calculation time', () => {
    const kingdom = new Kingdom('Test Kingdom');
    kingdom.addCharacter(CharacterType.KING);
    
    const beforeCalculation = Date.now();
    kingdom.calculateResourceGeneration(1);
    const afterCalculation = Date.now();
    
    // The last calculation time should be between before and after
    const lastCalc = kingdom.getLastCalculation();
    expect(lastCalc).toBeGreaterThanOrEqual(beforeCalculation);
    expect(lastCalc).toBeLessThanOrEqual(afterCalculation);
  });
});