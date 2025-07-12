import { Event, EventType, EventChoice, EventConsequence, ResourceRequirement } from '../Event';
import { Resources } from '../../value-objects/Resources';

export class NobleRebellionEvent1 extends Event {
  constructor() {
    super(
      'noble_rebellion_1',
      'The Noble Conspiracy',
      'Your spies have uncovered a conspiracy among several noble houses. They are dissatisfied with recent tax increases and are secretly meeting to discuss their grievances. How will you respond to this early warning?',
      EventType.Political,
      [
        new EventChoice({
          id: 'investigate_peacefully',
          description: 'Send diplomats to investigate and address their concerns',
          requirements: new ResourceRequirement({
            gold: 50,
            influence: 100,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -50,
              influence: -100,
              loyalty: 20,
              population: 0,
              militaryPower: 0
            }),
            stabilityChange: 5,
            loyaltyChange: 10,
            description: 'Your diplomatic approach is appreciated by some nobles.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'diplomatic_approach'
          }
        }),
        new EventChoice({
          id: 'show_force',
          description: 'Deploy troops near noble estates as a show of strength',
          requirements: new ResourceRequirement({
            gold: 100,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 150
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -100,
              influence: 50,
              loyalty: -30,
              population: 0,
              militaryPower: -50
            }),
            stabilityChange: -10,
            loyaltyChange: -15,
            description: 'The nobles see your military display as a threat.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'military_approach'
          }
        }),
        new EventChoice({
          id: 'ignore_rumors',
          description: 'Dismiss the reports as mere rumors and take no action',
          requirements: new ResourceRequirement({
            gold: 0,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: 0,
              influence: -20,
              loyalty: -10,
              population: 0,
              militaryPower: 0
            }),
            stabilityChange: -5,
            loyaltyChange: -5,
            description: 'Your inaction emboldens the conspirators.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'ignored_warning'
          }
        })
      ],
      undefined,
      {
        chainId: 'noble_rebellion',
        chainPosition: 1,
        chainLength: 3
      }
    );
  }
}

export class NobleRebellionEvent2 extends Event {
  constructor() {
    super(
      'noble_rebellion_2',
      'The Demands Escalate',
      'The noble houses have now formed a formal coalition and present a list of demands: reduced taxes, greater autonomy, and positions in your royal court. Their movement is gaining support among lesser nobles.',
      EventType.Political,
      [
        new EventChoice({
          id: 'negotiate_compromise',
          description: 'Negotiate a compromise, granting some concessions',
          requirements: new ResourceRequirement({
            gold: 200,
            influence: 150,
            loyalty: 0,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -200,
              influence: -150,
              loyalty: 50,
              population: 0,
              militaryPower: 0
            }),
            stabilityChange: 15,
            loyaltyChange: 20,
            description: 'The nobles appreciate your willingness to negotiate.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: -50,
                influence: 25,
                loyalty: 10,
                population: 0,
                militaryPower: 0
              }),
              stabilityChange: 5,
              loyaltyChange: 5,
              description: 'Ongoing tax reduction as per agreement.'
            })
          ],
          chainData: {
            nextEventModifier: 'negotiated_peace'
          }
        }),
        new EventChoice({
          id: 'divide_conquer',
          description: 'Attempt to divide the coalition by bribing key nobles',
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
              loyalty: 0,
              population: 0,
              militaryPower: 0
            }),
            stabilityChange: 0,
            loyaltyChange: -10,
            description: 'Some nobles accept your bribes, weakening the coalition.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'coalition_weakened'
          }
        }),
        new EventChoice({
          id: 'prepare_suppression',
          description: 'Reject all demands and prepare to suppress the rebellion',
          requirements: new ResourceRequirement({
            gold: 300,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 250
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -300,
              influence: 100,
              loyalty: -50,
              population: -50,
              militaryPower: -100
            }),
            stabilityChange: -20,
            loyaltyChange: -25,
            description: 'Your rejection sparks immediate unrest.'
          }),
          longTermEffects: [],
          chainData: {
            nextEventModifier: 'prepared_for_war'
          }
        })
      ],
      undefined,
      {
        chainId: 'noble_rebellion',
        chainPosition: 2,
        chainLength: 3,
        previousEventId: 'noble_rebellion_1'
      }
    );
  }
}

export class NobleRebellionEvent3 extends Event {
  constructor() {
    super(
      'noble_rebellion_3',
      'The Final Confrontation',
      'The situation has reached a critical point. The noble coalition stands at the gates of your capital with their armies. This is the moment that will define your reign and the future relationship with the nobility.',
      EventType.Political,
      [
        new EventChoice({
          id: 'peaceful_resolution',
          description: 'Achieve a peaceful resolution through a grand council',
          requirements: new ResourceRequirement({
            gold: 300,
            influence: 200,
            loyalty: 50,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -300,
              influence: -200,
              loyalty: 100,
              population: 100,
              militaryPower: 0
            }),
            stabilityChange: 30,
            loyaltyChange: 40,
            description: 'A historic peace accord is signed, ending the crisis.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 100,
                influence: 50,
                loyalty: 20,
                population: 50,
                militaryPower: 0
              }),
              stabilityChange: 10,
              loyaltyChange: 10,
              description: 'The new noble council brings prosperity.'
            })
          ]
        }),
        new EventChoice({
          id: 'force_surrender',
          description: 'Use overwhelming force to crush the rebellion',
          requirements: new ResourceRequirement({
            gold: 500,
            influence: 0,
            loyalty: 0,
            population: 0,
            militaryPower: 500
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: -500,
              influence: 150,
              loyalty: -100,
              population: -200,
              militaryPower: -300
            }),
            stabilityChange: -30,
            loyaltyChange: -50,
            description: 'The rebellion is crushed, but at great cost.'
          }),
          longTermEffects: [
            new EventConsequence({
              resourceChange: new Resources({
                gold: 50,
                influence: 25,
                loyalty: -10,
                population: -25,
                militaryPower: 50
              }),
              stabilityChange: -5,
              loyaltyChange: -5,
              description: 'Fear keeps the nobles in line, but resentment lingers.'
            })
          ]
        }),
        new EventChoice({
          id: 'abdicate_compromise',
          description: 'Abdicate in favor of a compromise candidate',
          requirements: new ResourceRequirement({
            gold: 0,
            influence: 300,
            loyalty: 100,
            population: 0,
            militaryPower: 0
          }),
          immediateEffect: new EventConsequence({
            resourceChange: new Resources({
              gold: 1000,
              influence: -300,
              loyalty: 0,
              population: 0,
              militaryPower: 0
            }),
            stabilityChange: 20,
            loyaltyChange: 0,
            description: 'Your noble sacrifice prevents civil war.'
          }),
          longTermEffects: []
        })
      ],
      undefined,
      {
        chainId: 'noble_rebellion',
        chainPosition: 3,
        chainLength: 3,
        previousEventId: 'noble_rebellion_2'
      }
    );
  }
}

export function createNobleRebellionChain(): Event[] {
  return [
    new NobleRebellionEvent1(),
    new NobleRebellionEvent2(),
    new NobleRebellionEvent3()
  ];
}