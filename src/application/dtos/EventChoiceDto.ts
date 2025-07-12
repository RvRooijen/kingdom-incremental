export interface MakeEventChoiceInputDto {
  kingdomId: string;
  eventId: string;
  choiceId: string;
}

export interface EventChoiceResultDto {
  success: boolean;
  message: string;
  resourceChanges?: {
    gold?: number;
    influence?: number;
    loyalty?: number;
    population?: number;
    militaryPower?: number;
  };
  factionImpacts?: {
    factionName: string;
    loyaltyChange: number;
    influenceChange: number;
  }[];
}