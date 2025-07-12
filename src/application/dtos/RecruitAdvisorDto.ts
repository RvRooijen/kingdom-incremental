export interface RecruitAdvisorInputDto {
  kingdomId: string;
  advisorName: string;
  specialty: 'Military' | 'Economic' | 'Diplomatic' | 'Religious' | 'Administrative';
}

export interface RecruitAdvisorOutputDto {
  success: boolean;
  advisor?: {
    id: string;
    name: string;
    specialty: string;
    effectiveness: number;
  };
  cost: {
    gold: number;
    influence: number;
  };
  message: string;
}