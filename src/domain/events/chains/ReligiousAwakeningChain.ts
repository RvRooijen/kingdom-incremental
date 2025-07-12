import { Event, EventType, EventChoice, EventConsequence, ResourceRequirement } from '../Event';
import { Resources } from '../../value-objects/Resources';

export class ReligiousAwakeningEvent1 extends Event {
  constructor() {
    super(
      'religious_awakening_1',
      'The Prophet Arrives',
      'A charismatic prophet has arrived in your kingdom, preaching a message of spiritual renewal and social reform. Crowds gather wherever they speak, and their following grows daily. How will you respond to this religious movement?',
      EventType.Social,
      [
        new EventChoice({
          id: 'embrace_prophet',
          description: 'Welcome the prophet and embrace the movement',
          requirements: new ResourceRequirement({
            gold: 100,
            influence: 150,
            loyalty: 50,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -100,
              influence: -150,
              loyalty: 80,
              population: 100,
              militaryPower: 0
            }),
            stabilityChange: 15,
            loyaltyChange: 30,
            description: 'The people rejoice at your spiritual leadership.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'religious_supporter'
          }
        }),
        new EventChoice({
          id: 'tolerate_movement',
          description: 'Allow the movement but maintain distance',
          requirements: new ResourceRequirement({
            gold: 0,
            influence: 50,
            loyalty: 0,
            population: 0,
            militaryPower: 50
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: 0,
              influence: -50,
              loyalty: 20,
              population: 50,
              militaryPower: 0
            }),
            stabilityChange: 5,
            loyaltyChange: 10,
            description: 'Your tolerance is noted but lacks enthusiasm.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'neutral_stance'
          }
        }),
        new EventChoice({
          id: 'suppress_prophet',
          description: 'Declare the prophet a heretic and ban the movement',
          requirements: new ResourceRequirement({
            gold: 200,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 200
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -200,
              influence: 100,
              loyalty: -60,
              population: -50,
              militaryPower: -100
            }),
            stabilityChange: -20,
            loyaltyChange: -30,
            description: 'Your suppression angers many faithful citizens.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'religious_opponent'
          }
        })
      ],
      undefined,
      {
        chainId: 'religious_awakening',
        chainPosition: 1,
        chainLength: 3
      }
    );
  }
}

export class ReligiousAwakeningEvent2 extends Event {
  constructor() {
    super(
      'religious_awakening_2',
      'The Great Schism',
      'The religious movement has split your kingdom. Traditional clergy oppose the new teachings, while commoners embrace them enthusiastically. Tensions rise between old and new believers, threatening civil unrest.',
      EventType.Social,
      [
        new EventChoice({
          id: 'reform_church',
          description: 'Reform the official church to incorporate new teachings',
          requirements: new ResourceRequirement({
            gold: 500,
            influence: 250,
            loyalty: 100,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -500,
              influence: -250,
              loyalty: 60,
              population: 150,
              militaryPower: 0
            }),
            stabilityChange: 20,
            loyaltyChange: 25,
            description: 'Religious unity is restored through reform.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 50,
                influence: 40,
                loyalty: 20,
                population: 50,
                militaryPower: 0
              }),
              stabilityChange: 10,
              loyaltyChange: 10,
              description: 'The reformed church brings new vitality.'
            })
          ],
          chainData: {
            nextEventModifier: 'reformed_faith'
          }
        }),
        new EventChoice({
          id: 'enforce_tradition',
          description: 'Support traditional clergy and suppress reformers',
          requirements: new ResourceRequirement({
            gold: 300,
            influence: 100,
            loyalty: 0,
            population: 0,
            militaryPower: 300
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -300,
              influence: -100,
              loyalty: -40,
              population: -100,
              militaryPower: -150
            }),
            stabilityChange: -15,
            loyaltyChange: -20,
            description: 'Enforcing tradition creates underground resistance.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'traditionalist'
          }
        }),
        new EventChoice({
          id: 'secular_state',
          description: 'Declare religious neutrality and separate church from state',
          requirements: new ResourceRequirement({
            gold: 400,
            influence: 300,
            loyalty: 50,
            population: 0,
            militaryPower: 150
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -400,
              influence: -300,
              loyalty: -20,
              population: 50,
              militaryPower: -50
            }),
            stabilityChange: 0,
            loyaltyChange: -10,
            description: 'Your secular approach confuses many citizens.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'secularist'
          }
        })
      ],
      undefined,
      {
        chainId: 'religious_awakening',
        chainPosition: 2,
        chainLength: 3,
        previousEventId: 'religious_awakening_1'
      }
    );
  }
}

export class ReligiousAwakeningEvent3 extends Event {
  constructor() {
    super(
      'religious_awakening_3',
      'The Divine Mandate',
      'The religious movement has reached its climax. The prophet claims to have received a divine vision about your kingdom\'s destiny. This moment will determine whether your realm becomes a theocracy, remains secular, or finds a middle path.',
      EventType.Social,
      [
        new EventChoice({
          id: 'divine_kingdom',
          description: 'Proclaim a holy kingdom under divine guidance',
          requirements: new ResourceRequirement({
            gold: 800,
            influence: 400,
            loyalty: 200,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -800,
              influence: -400,
              loyalty: 150,
              population: 300,
              militaryPower: 100
            }),
            stabilityChange: 50,
            loyaltyChange: 60,
            description: 'Your kingdom is transformed into a beacon of faith.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 100,
                influence: 80,
                loyalty: 40,
                population: 100,
                militaryPower: 50
              }),
              stabilityChange: 20,
              loyaltyChange: 20,
              description: 'Divine blessing brings prosperity and unity.'
            })
          ]
        }),
        new EventChoice({
          id: 'enlightened_monarchy',
          description: 'Maintain secular rule while respecting all faiths',
          requirements: new ResourceRequirement({
            gold: 600,
            influence: 350,
            loyalty: 100,
            population: 0,
            militaryPower: 200
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -600,
              influence: -350,
              loyalty: 40,
              population: 200,
              militaryPower: -100
            }),
            stabilityChange: 30,
            loyaltyChange: 20,
            description: 'You achieve a balance between faith and reason.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 150,
                influence: 60,
                loyalty: 20,
                population: 75,
                militaryPower: 25
              }),
              stabilityChange: 15,
              loyaltyChange: 10,
              description: 'Religious tolerance fosters innovation.'
            })
          ]
        }),
        new EventChoice({
          id: 'exile_prophet',
          description: 'Exile the prophet and restore old order',
          requirements: new ResourceRequirement({
            gold: 400,
            influence: 200,
            loyalty: 0,
            population: 0,
            militaryPower: 400
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -400,
              influence: -200,
              loyalty: -80,
              population: -150,
              militaryPower: -200
            }),
            stabilityChange: -30,
            loyaltyChange: -40,
            description: 'The prophet\'s exile sparks riots and unrest.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 50,
                influence: 30,
                loyalty: -10,
                population: -25,
                militaryPower: 50
              }),
              stabilityChange: -10,
              loyaltyChange: -10,
              description: 'Religious wounds heal slowly.'
            })
          ]
        })
      ],
      undefined,
      {
        chainId: 'religious_awakening',
        chainPosition: 3,
        chainLength: 3,
        previousEventId: 'religious_awakening_2'
      }
    );
  }
}

export function createReligiousAwakeningChain(): Event[] {
  return [
    new ReligiousAwakeningEvent1(),
    new ReligiousAwakeningEvent2(),
    new ReligiousAwakeningEvent3()
  ];
}