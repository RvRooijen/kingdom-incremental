export interface ResourcesDto {
  gold: number;
  influence: number;
  loyalty: number;
  population: number;
  militaryPower: number;
}

export interface AdvisorDto {
  id: string;
  name: string;
  specialty: string;
  effectiveness: number;
}

export interface FactionDto {
  name: string;
  description: string;
  loyalty: number;
  influence: number;
}

export interface KingdomStateDto {
  kingdomId: string;
  kingdomName: string;
  rulerName: string;
  resources: ResourcesDto;
  advisors: AdvisorDto[];
  factions: FactionDto[];
  currentTurn: number;
  prestigeLevel?: number;
  completedEventsCount?: number;
}