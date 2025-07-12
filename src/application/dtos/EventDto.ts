export interface EventChoiceDto {
  id: string;
  description: string;
  requirements?: {
    gold?: number;
    influence?: number;
    loyalty?: number;
    militaryPower?: number;
  };
}

export interface EventDto {
  id: string;
  title: string;
  description: string;
  type: 'Economic' | 'Political' | 'Military' | 'Religious' | 'Social';
  choices: EventChoiceDto[];
  expiresInTurns: number;
}