import { Event, EventType, EventChoice, EventConsequence, ResourceRequirement } from '../Event';
import { Resources } from '../../value-objects/Resources';

export class MerchantGuildEvent1 extends Event {
  constructor() {
    super(
      'merchant_guild_1',
      'The Guild Proposal',
      'The Merchant Guild approaches you with an ambitious proposal: they wish to establish new trade routes to distant lands. They promise great wealth, but request reduced tariffs and greater autonomy in return.',
      EventType.Economic,
      [
        new EventChoice({
          id: 'full_support',
          description: 'Fully support the guild with funding and privileges',
          requirements: new ResourceRequirement({
            gold: 500,
            influence: 100,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -500,
              influence: -100,
              loyalty: 20,
              population: 50,
              militaryPower: 0
            }),
            stabilityChange: 10,
            loyaltyChange: 15,
            description: 'The merchants are delighted with your support.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'full_cooperation'
          }
        }),
        new EventChoice({
          id: 'limited_support',
          description: 'Offer limited support with strict royal oversight',
          requirements: new ResourceRequirement({
            gold: 200,
            influence: 50,
            loyalty: 0,
            population: 0,
            militaryPower: 50
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -200,
              influence: -50,
              loyalty: 0,
              population: 25,
              militaryPower: 0
            }),
            stabilityChange: 5,
            loyaltyChange: 0,
            description: 'The guild accepts your terms reluctantly.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'controlled_expansion'
          }
        }),
        new EventChoice({
          id: 'royal_monopoly',
          description: 'Reject the guild and establish a royal trading company',
          requirements: new ResourceRequirement({
            gold: 800,
            influence: 150,
            loyalty: 0,
            population: 0,
            militaryPower: 100
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -800,
              influence: -150,
              loyalty: -30,
              population: 0,
              militaryPower: -50
            }),
            stabilityChange: -10,
            loyaltyChange: -20,
            description: 'The guild is outraged by your power grab.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'royal_control'
          }
        })
      ],
      undefined,
      {
        chainId: 'merchant_expansion',
        chainPosition: 1,
        chainLength: 4
      }
    );
  }
}

export class MerchantGuildEvent2 extends Event {
  constructor() {
    super(
      'merchant_guild_2',
      'First Trade Returns',
      'The first merchant caravans have returned from their journeys. The results are mixed - some routes are highly profitable, others face bandit attacks and political obstacles. The guild requests additional resources to secure the routes.',
      EventType.Economic,
      [
        new EventChoice({
          id: 'military_escort',
          description: 'Provide military escorts for all trade caravans',
          requirements: new ResourceRequirement({
            gold: 300,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 200
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -300,
              influence: 50,
              loyalty: 10,
              population: 0,
              militaryPower: -100
            }),
            stabilityChange: 15,
            loyaltyChange: 10,
            description: 'Trade routes are now secure and profitable.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 150,
                influence: 10,
                loyalty: 5,
                population: 25,
                militaryPower: 0
              }),
              stabilityChange: 5,
              loyaltyChange: 5,
              description: 'Secure trade brings steady income.'
            })
          ],
          chainData: {
            nextEventModifier: 'secured_routes'
          }
        }),
        new EventChoice({
          id: 'diplomatic_solution',
          description: 'Use diplomacy to secure safe passage agreements',
          requirements: new ResourceRequirement({
            gold: 400,
            influence: 200,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -400,
              influence: -200,
              loyalty: 30,
              population: 50,
              militaryPower: 0
            }),
            stabilityChange: 20,
            loyaltyChange: 15,
            description: 'Treaties ensure peaceful trade relations.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'diplomatic_trade'
          }
        }),
        new EventChoice({
          id: 'abandon_risky',
          description: 'Abandon risky routes and focus on safe ones',
          requirements: new ResourceRequirement({
            gold: 0,
            influence: 50,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: 100,
              influence: -50,
              loyalty: -10,
              population: 0,
              militaryPower: 0
            }),
            stabilityChange: 0,
            loyaltyChange: -5,
            description: 'The guild is disappointed but complies.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'conservative_approach'
          }
        })
      ],
      undefined,
      {
        chainId: 'merchant_expansion',
        chainPosition: 2,
        chainLength: 4,
        previousEventId: 'merchant_guild_1'
      }
    );
  }
}

export class MerchantGuildEvent3 extends Event {
  constructor() {
    super(
      'merchant_guild_3',
      'Foreign Competition',
      'A powerful foreign trading company has arrived, offering better prices and exotic goods. The local Merchant Guild demands protection from this competition, warning that many local traders may go bankrupt.',
      EventType.Economic,
      [
        new EventChoice({
          id: 'protect_local',
          description: 'Impose heavy tariffs on foreign traders',
          requirements: new ResourceRequirement({
            gold: 0,
            influence: 150,
            loyalty: 0,
            population: 0,
            militaryPower: 100
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: 200,
              influence: -150,
              loyalty: 40,
              population: 0,
              militaryPower: -50
            }),
            stabilityChange: 10,
            loyaltyChange: 20,
            description: 'Local merchants cheer your protectionist policies.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'protectionist'
          }
        }),
        new EventChoice({
          id: 'free_market',
          description: 'Allow free competition to benefit consumers',
          requirements: new ResourceRequirement({
            gold: 0,
            influence: 100,
            loyalty: 50,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: 300,
              influence: -100,
              loyalty: -40,
              population: 100,
              militaryPower: 0
            }),
            stabilityChange: -10,
            loyaltyChange: -20,
            description: 'Cheaper goods please the people, but merchants suffer.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'open_market'
          }
        }),
        new EventChoice({
          id: 'merge_companies',
          description: 'Negotiate a merger between local and foreign traders',
          requirements: new ResourceRequirement({
            gold: 600,
            influence: 250,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -600,
              influence: -250,
              loyalty: 20,
              population: 150,
              militaryPower: 0
            }),
            stabilityChange: 25,
            loyaltyChange: 15,
            description: 'A new powerful trading consortium is formed.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 200,
                influence: 30,
                loyalty: 10,
                population: 50,
                militaryPower: 0
              }),
              stabilityChange: 10,
              loyaltyChange: 5,
              description: 'The merged company brings prosperity.'
            })
          ],
          chainData: {
            nextEventModifier: 'merged_trade'
          }
        })
      ],
      undefined,
      {
        chainId: 'merchant_expansion',
        chainPosition: 3,
        chainLength: 4,
        previousEventId: 'merchant_guild_2'
      }
    );
  }
}

export class MerchantGuildEvent4 extends Event {
  constructor() {
    super(
      'merchant_guild_4',
      'The Trade Empire',
      'Your kingdom has become a major trading hub. The Merchant Guild now wields enormous influence and wealth. They propose creating a formal Trade Council with significant political power. This decision will shape your kingdom\'s economic future.',
      EventType.Economic,
      [
        new EventChoice({
          id: 'trade_council',
          description: 'Establish the Trade Council as a formal institution',
          requirements: new ResourceRequirement({
            gold: 1000,
            influence: 300,
            loyalty: 100,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -1000,
              influence: -300,
              loyalty: 50,
              population: 300,
              militaryPower: 0
            }),
            stabilityChange: 40,
            loyaltyChange: 30,
            description: 'The Trade Council ushers in an era of prosperity.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 300,
                influence: 50,
                loyalty: 20,
                population: 100,
                militaryPower: 0
              }),
              stabilityChange: 15,
              loyaltyChange: 10,
              description: 'The Trade Council generates wealth and stability.'
            })
          ]
        }),
        new EventChoice({
          id: 'royal_commerce',
          description: 'Maintain royal control over all major trade',
          requirements: new ResourceRequirement({
            gold: 500,
            influence: 200,
            loyalty: 0,
            population: 0,
            militaryPower: 300
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -500,
              influence: -200,
              loyalty: -20,
              population: 100,
              militaryPower: -150
            }),
            stabilityChange: 10,
            loyaltyChange: -10,
            description: 'You maintain control but face merchant resentment.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 150,
                influence: 30,
                loyalty: -5,
                population: 25,
                militaryPower: 25
              }),
              stabilityChange: 5,
              loyaltyChange: -5,
              description: 'Royal trade monopoly provides steady income.'
            })
          ]
        }),
        new EventChoice({
          id: 'merchant_republic',
          description: 'Transform into a merchant republic',
          requirements: new ResourceRequirement({
            gold: 2000,
            influence: 500,
            loyalty: 200,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -2000,
              influence: -500,
              loyalty: 100,
              population: 500,
              militaryPower: 0
            }),
            stabilityChange: 50,
            loyaltyChange: 40,
            description: 'A new era of merchant rule begins!'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 500,
                influence: 100,
                loyalty: 30,
                population: 150,
                militaryPower: 0
              }),
              stabilityChange: 20,
              loyaltyChange: 15,
              description: 'The merchant republic thrives.'
            })
          ]
        })
      ],
      undefined,
      {
        chainId: 'merchant_expansion',
        chainPosition: 4,
        chainLength: 4,
        previousEventId: 'merchant_guild_3'
      }
    );
  }
}

export function createMerchantGuildChain(): Event[] {
  return [
    new MerchantGuildEvent1(),
    new MerchantGuildEvent2(),
    new MerchantGuildEvent3(),
    new MerchantGuildEvent4()
  ];
}