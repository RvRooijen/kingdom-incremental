export interface EventChoiceDto {
  id: string;
  description: string;
  requirements?: {
    gold?: number;
    influence?: number;
    loyalty?: number;
    militaryPower?: number;
  };
  chainData?: {
    nextEventModifier?: string;
    unlockConditions?: string[];
  };
}

export interface EventChainDataDto {
  chainId: string;
  nextEventId?: string;
  previousEventId?: string;
  chainPosition: number;
  chainLength: number;
}

export interface EventDto {
  id: string;
  title: string;
  description: string;
  type: 'Economic' | 'Political' | 'Military' | 'Religious' | 'Social' | 'Diplomatic';
  choices: EventChoiceDto[];
  expiresInTurns: number;
  chainData?: EventChainDataDto;
}