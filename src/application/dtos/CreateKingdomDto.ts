export interface CreateKingdomInputDto {
  kingdomName: string;
  rulerName: string;
}

export interface CreateKingdomOutputDto {
  kingdomId: string;
  kingdomName: string;
  rulerName: string;
  createdAt: Date;
}